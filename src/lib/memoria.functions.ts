import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extrairTemas, LIMITE_MEMORIA_CURTA, mascarar } from "./privacidade";

const encerramento = z.object({
  conversaId: z.string().uuid(),
  mensagens: z.array(z.object({ papel: z.enum(["user", "assistant"]), conteudo: z.string().max(10000) })).max(LIMITE_MEMORIA_CURTA).default([]),
});

async function encerrar(sb: SupabaseClient<Database>, userId: string, id: string, textos: string[]) {
  const conversa = await sb.from("conversas").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
  if (conversa.error || !conversa.data) throw new Error("Conversa não autorizada.");
  // A IA nunca recebe a transcrição: apenas categorias acadêmicas permitidas.
  const temas = extrairTemas(textos);
  const { selecionarTemas } = await import("./resumo.server");
  const escolhidos = await selecionarTemas(temas);
  const result = await sb.rpc("salvar_resumo_seguro", { _conversa_id: id, _temas: escolhidos });
  if (result.error) throw new Error("Não foi possível encerrar a conversa.");
}

export const encerrarConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => encerramento.parse(d))
  .handler(async ({ data, context }) => {
    await encerrar(context.supabase, context.userId, data.conversaId, data.mensagens.map((m) => m.conteudo));
    return { ok: true };
  });

export const encerrarSessao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Compatibilidade com o protótipo anterior; o próximo chat usa somente RAM.
    const { data, error } = await context.supabase.from("mensagens").select("conversa_id,conteudo,criado_em")
      .eq("user_id", context.userId).order("criado_em", { ascending: false });
    if (error) throw new Error("Não foi possível encerrar a sessão.");
    const ids = [...new Set((data ?? []).map((m) => m.conversa_id))];
    for (const id of ids) {
      const textos = (data ?? []).filter((m) => m.conversa_id === id).slice(0, LIMITE_MEMORIA_CURTA).map((m) => m.conteudo);
      await encerrar(context.supabase, context.userId, id, textos);
    }
    return { encerradas: ids.length };
  });

export const abrirProtocolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    tipo: z.enum(["atendimento", "acessibilidade", "acolhimento", "exclusao_conta", "contestacao", "urgencia"]),
    setor: z.enum(["Assistência Estudantil", "Núcleo de Acessibilidade", "Acolhimento Psicológico", "Encarregado de Dados (LGPD)"]),
    resumo: z.string().max(5000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Todo texto livre fica restrito: detector por palavras não garante sigilo.
    const setor = data.tipo === "acessibilidade" ? "Núcleo de Acessibilidade" : data.tipo === "acolhimento" || data.tipo === "urgencia" ? "Acolhimento Psicológico" : data.setor;
    const { error } = await context.supabase.from("protocolos").insert({
      user_id: context.userId, tipo: data.tipo, setor,
      resumo: data.tipo === "contestacao" ? "Contestação de orientação registrada." : data.tipo === "urgencia" ? "Acolhimento prioritário solicitado." : "Solicitação de atendimento registrada.",
      restrito: true, prioridade: data.tipo === "urgencia" ? "alta" : "normal",
      detalhes_restritos: mascarar(data.resumo),
    });
    if (error) throw new Error("Não foi possível abrir o protocolo.");
    await context.supabase.from("logs_acoes").insert({ user_id: context.userId, acao: data.tipo === "contestacao" ? "contestacao_aberta" : "protocolo_aberto" });
    if (data.tipo !== "exclusao_conta") await context.supabase.from("logs_acoes").insert({ user_id: context.userId, acao: "encaminhamento" });
    return { restrito: true };
  });

export const registrarFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ util: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    // Sem texto da conversa: só a nota.
    const { error } = await context.supabase.from("feedbacks").insert({ user_id: context.userId, nota: data.util ? 1 : 0 });
    if (error) throw new Error("Não foi possível registrar a avaliação.");
    await context.supabase.from("logs_acoes").insert({ user_id: context.userId, acao: "feedback_registrado" });
    return { ok: true };
  });
