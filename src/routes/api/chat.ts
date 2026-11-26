import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { buscarDocumentos, detectarUrgencia, FORMATO_RESPOSTA, PROMPT_SISTEMA } from "@/lib/chat-regras";
import { LIMITE_MEMORIA_CURTA, mascarar } from "@/lib/privacidade";

const corpo = z.object({
  mensagens: z.array(z.object({ papel: z.enum(["user", "assistant"]), conteudo: z.string().max(4000) })).min(1).max(LIMITE_MEMORIA_CURTA),
});

function cliente(token: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Não autorizado", { status: 401 });
        const sb = cliente(token);
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return new Response("Não autorizado", { status: 401 });
        const parsed = corpo.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Pedido inválido", { status: 400 });
        const msgs = parsed.data.mensagens;
        const pergunta = msgs[msgs.length - 1]!.conteudo;

        const urg = detectarUrgencia(pergunta);
        if (urg !== "nenhum") {
          await sb.from("logs_acoes").insert({ user_id: u.user.id, acao: "urgencia_detectada" });
          return Response.json({ urgencia: urg });
        }

        const [docsR, prefR, resR] = await Promise.all([
          sb.from("documentos_oficiais").select("id,titulo,tipo,texto,data_vigencia,fonte"),
          sb.from("preferencias").select("memoria_longa_ativa,nivel_linguagem").eq("user_id", u.user.id).maybeSingle(),
          sb.from("resumos_conversa").select("resumo").eq("user_id", u.user.id).order("criado_em", { ascending: false }).limit(3),
        ]);
        const contexto = msgs.map((m) => `${m.papel}: ${m.conteudo}`).slice(-4).join(" ");
        const docs = buscarDocumentos(`${pergunta} ${contexto}`, docsR.data ?? []);
        await sb.from("logs_acoes").insert({ user_id: u.user.id, acao: "consulta_documento" });

        const autorizou = prefR.data?.memoria_longa_ativa === true;
        const memoria = autorizou && resR.data?.length ? `\nResumo de conversas anteriores (autorizado pelo estudante):\n${resR.data.map((r) => r.resumo).join("\n")}` : "";
        const linguagem = autorizou && prefR.data?.nivel_linguagem ? `\nPreferência de linguagem: ${prefR.data.nivel_linguagem}.` : "";
        const trechos = docs.length
          ? docs.map((d) => `<documento titulo="${d.titulo}" vigencia="${d.data_vigencia ?? "não informada"}">\n${d.texto.slice(0, 4000)}\n</documento>`).join("\n")
          : "(nenhum documento relevante encontrado)";

        const { streamResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
        const fontes = docs.map((d) => ({ titulo: d.titulo, vigencia: d.data_vigencia }));
        try {
          const stream = await streamResponse({
            model: "openai/gpt-6-astra",
            instructions: `${PROMPT_SISTEMA}\n\n${FORMATO_RESPOSTA}${linguagem}${memoria}\n\n<documentos>\n${trechos}\n</documentos>`,
            input: msgs.map((m) => ({ role: m.papel, content: mascarar(m.conteudo) })),
          });
          const enc = new TextEncoder();
          const body = new ReadableStream({
            async start(ctrl) {
              try {
                for await (const ev of stream) {
                  if (ev.type === "response.output_text.delta") ctrl.enqueue(enc.encode(ev.delta));
                }
              } catch (e) {
                if (e instanceof GatewayError) console.error("chat stream", e.code);
                ctrl.enqueue(enc.encode("\n\n[A resposta foi interrompida. Tente de novo ou fale com uma pessoa.]"));
              }
              ctrl.close();
            },
          });
          return new Response(body, {
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-fontes": encodeURIComponent(JSON.stringify(fontes)) },
          });
        } catch (e) {
          if (e instanceof GatewayError) console.error("chat", e.code);
          return new Response("A Atena está indisponível agora. Tente de novo ou fale com uma pessoa.", { status: 503 });
        }
      },
    },
  },
});
