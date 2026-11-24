import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { contemDadoSensivel, limparResumo, mascarar, LIMITE_MEMORIA_CURTA } from "./privacidade";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

async function resumirComIA(transcricao: string): Promise<string> {
  try {
    const r = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions:
        "Resuma a conversa em no máximo 3 linhas, em português: 'Tema: ...', 'Protocolo: ...', 'Pendências: ...'. " +
        "NUNCA inclua dados sensíveis (saúde, renda, deficiência, religião, orientação sexual, raça, política) nem dados pessoais (nomes, CPF, telefone, e-mail, números).",
      input: transcricao,
    });
    const out = (r as { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }).output ?? [];
    return out.flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("\n");
  } catch (e) {
    if (e instanceof GatewayError) console.error("resumo IA falhou", e.code, e.ids);
    else console.error(e);
    return "Tema: conversa com a Atena\nProtocolo: verificar em Meus protocolos\nPendências: —";
  }
}

async function encerrar(supabase: Sb, userId: string, conversaId: string) {
  const { data: msgs, error } = await supabase
    .from("mensagens").select("papel,conteudo").eq("conversa_id", conversaId)
    .order("criado_em", { ascending: false }).limit(LIMITE_MEMORIA_CURTA);
  if (error) throw new Error("Falha ao ler a conversa");
  if (msgs?.length) {
    const { data: prot } = await supabase.from("protocolos").select("tipo,status").eq("user_id", userId)
      .order("criado_em", { ascending: false }).limit(1);
    const transcricao = mascarar(
      (msgs as Array<{ papel: string; conteudo: string }>).reverse()
        .map((m) => `${m.papel === "user" ? "Estudante" : "Atena"}: ${m.conteudo}`)
        .filter((l) => !contemDadoSensivel(l)).join("\n"),
    ) + (prot?.[0] ? `\nÚltimo protocolo: ${prot[0].tipo} (${prot[0].status})` : "");
    const resumo = limparResumo(await resumirComIA(transcricao));
    if (resumo) {
      const ins = await supabase.from("resumos_conversa").insert({ user_id: userId, conversa_id: conversaId, resumo });
      if (ins.error) throw new Error("Falha ao salvar resumo");
    }
  }
  // Memória curta: apaga as mensagens ao encerrar.
  const del = await supabase.from("mensagens").delete().eq("conversa_id", conversaId);
  if (del.error) throw new Error("Falha ao apagar mensagens");
}

export const encerrarConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversaId: string }) => d)
  .handler(async ({ data, context }) => {
    await encerrar(context.supabase, context.userId, data.conversaId);
    return { ok: true };
  });

export const encerrarSessao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("mensagens").select("conversa_id").eq("user_id", context.userId);
    const ids = [...new Set((data ?? []).map((m: { conversa_id: string }) => m.conversa_id))];
    for (const id of ids) await encerrar(context.supabase, context.userId, id);
    return { encerradas: ids.length };
  });

const SETOR_SENSIVEL = "Núcleo de Acessibilidade / Acolhimento";

export const abrirProtocolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tipo: string; setor: string; resumo: string }) => d)
  .handler(async ({ data, context }) => {
    const sensivel = contemDadoSensivel(data.resumo);
    const { error } = await context.supabase.from("protocolos").insert({
      user_id: context.userId,
      tipo: data.tipo,
      setor: sensivel ? SETOR_SENSIVEL : data.setor,
      resumo: sensivel ? "Atendimento com informações restritas ao setor." : mascarar(data.resumo),
      restrito: sensivel,
      detalhes_restritos: sensivel ? mascarar(data.resumo) : null,
    });
    if (error) throw new Error("Falha ao abrir protocolo");
    return { restrito: sensivel };
  });
