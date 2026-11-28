import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registrarLog } from "@/lib/auth";
import { PrivacyText } from "@/components/atena/PrivacyText";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/meus-dados")({
  head: () => ({
    meta: [
      { title: "Meus dados e privacidade – Atena" },
      { name: "description", content: "Veja seus resumos, controle a memória da Atena, baixe ou exclua seus dados." },
      { property: "og:title", content: "Meus dados e privacidade – Atena" },
      { property: "og:description", content: "Controle dos seus dados na Atena." },
    ],
  }),
  component: MeusDados,
});

const MAPA = [
  ["Últimas 10 mensagens da conversa", "Dar contexto à resposta da Atena", "Apagadas ao encerrar a conversa ou sair"],
  ["Resumo da conversa (até 3 linhas, sem dados sensíveis)", "Lembrar o tema, protocolo e pendências", "90 dias; indisponível ao vencer e removido na limpeza diária"],
  ["Preferências (canal, lembretes, nível de linguagem)", "Adaptar o atendimento a você", "Só se você ligar; até você desligar"],
  ["Perfil (nome, e-mail, matrícula, curso, semestre)", "Identificar você e orientar sobre seu curso", "Enquanto a conta existir"],
  ["Protocolos de atendimento", "Encaminhar seu caso a uma pessoa da equipe", "Até 5 anos (registro administrativo)"],
  ["Protocolos restritos (saúde ou deficiência)", "Atendimento pelo setor competente, somente", "Até 5 anos, visíveis só ao setor"],
  ["Registros de ações (sem dados pessoais)", "Segurança e auditoria", "Enquanto a conta existir"],
];

function MeusDados() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const key = ["meus-dados", userId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [perfil, resumos, protocolos, pref] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", userId).maybeSingle(),
        supabase.from("resumos_conversa").select("*").eq("user_id", userId).order("criado_em", { ascending: false }),
        supabase.from("protocolos").select("id,user_id,tipo,status,setor,resumo,criado_em,restrito,resposta,respondido_em,prazo_resposta").eq("user_id", userId).order("criado_em", { ascending: false }),
        supabase.from("preferencias").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      return { perfil: perfil.data, resumos: resumos.data ?? [], protocolos: protocolos.data ?? [], pref: pref.data };
    },
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: key });

  async function alternarMemoria(ativa: boolean) {
    const { error } = await supabase.from("preferencias").upsert({ user_id: userId, memoria_longa_ativa: ativa });
    if (error) { toast.error("Não foi possível salvar."); return; }
    await registrarLog(ativa ? "memoria_longa_ligada" : "memoria_longa_desligada");
    toast.success(ativa ? "A Atena vai lembrar suas preferências." : "Preferências apagadas e memória desligada.");
    recarregar();
  }

  async function apagarResumo(id?: string) {
    if (!window.confirm(id ? "Apagar este resumo?" : "Apagar todos os seus resumos?")) return;
    const q = supabase.from("resumos_conversa").delete().eq("user_id", userId);
    const { error } = id ? await q.eq("id", id) : await q;
    if (error) { toast.error("Não foi possível apagar."); return; }
    await registrarLog(id ? "resumo_apagado" : "todos_resumos_apagados");
    toast.success("Apagado.");
    recarregar();
  }

  async function salvarPreferencia(valor: { canal_preferido?: string; nivel_linguagem?: string; lembretes_ativos?: boolean }) {
    if (!data?.pref?.memoria_longa_ativa) return;
    const { error } = await supabase.from("preferencias").update(valor).eq("user_id", userId).eq("memoria_longa_ativa", true);
    if (error) { toast.error("Não foi possível salvar a preferência."); return; }
    await registrarLog("preferencias_atualizadas");
    await recarregar();
  }

  async function baixar() {
    const tabelas = ["conversas", "mensagens", "feedbacks", "resumos_conversa", "preferencias"] as const;
    const res = await Promise.all(tabelas.map((t) => supabase.from(t).select("*").eq("user_id", userId)));
    const perfil = await supabase.from("perfis").select("*").eq("id", userId);
    if (perfil.error || res.some((r) => r.error)) { toast.error("Não foi possível baixar todos os dados. Tente novamente."); return; }
    const protocolos = await supabase.from("protocolos").select("id,user_id,tipo,status,setor,resumo,criado_em,restrito,resposta,respondido_em,prazo_resposta").eq("user_id", userId);
    const logs = await supabase.from("logs_acoes").select("*").eq("user_id", userId);
    if (protocolos.error || logs.error) { toast.error("Não foi possível baixar todos os dados."); return; }
    const out: Record<string, unknown> = { perfil: perfil.data, protocolos: protocolos.data, logs_acoes: logs.data };
    tabelas.forEach((t, i) => (out[t] = res[i]?.data));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = "meus-dados-atena.json";
    a.click();
    URL.revokeObjectURL(a.href);
    await registrarLog("download_dados");
  }

  async function excluirConta() {
    if (!window.confirm("Solicitar a exclusão da sua conta e de todos os seus dados?")) return;
    const { error } = await supabase.from("protocolos").insert({
      user_id: userId, tipo: "exclusao_conta", setor: "Encarregado de Dados (LGPD)",
      resumo: "Estudante solicitou a exclusão da conta e dos dados pessoais.",
    });
    if (error) { toast.error("Não foi possível registrar o pedido."); return; }
    await registrarLog("pedido_exclusao_conta");
    toast.success("Pedido registrado. Responderemos em até 15 dias.");
    recarregar();
  }

  const p = data?.perfil;
  const memAtiva = data?.pref?.memoria_longa_ativa ?? false;
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Meus dados e privacidade</h1>

      <section className="rounded-xl border-2 bg-card p-6 shadow-soft">
        <h2 className="text-2xl font-bold">Meu perfil</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-lg">
          <dt className="font-semibold">Nome</dt><dd>{p?.nome}</dd>
          <dt className="font-semibold">E-mail</dt><dd className="break-all">{p?.email}</dd>
          <dt className="font-semibold">Matrícula</dt><dd>{p?.matricula} (fictícia)</dd>
          <dt className="font-semibold">Curso</dt><dd>{p?.curso}</dd>
          <dt className="font-semibold">Semestre</dt><dd>{p?.semestre ?? "não informado"}</dd>
        </dl>
      </section>

      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Memória de preferências</h2>
        <div className="mt-4 flex items-center gap-4">
          <Switch id="memoria" checked={memAtiva} onCheckedChange={alternarMemoria} className="scale-125" />
          <Label htmlFor="memoria" className="text-lg">Permitir que a Atena lembre minhas preferências</Label>
        </div>
        <p className="mt-2 text-muted-foreground">
          Desligado por padrão. Guarda só canal preferido, lembretes e nível de linguagem. Ao desligar, tudo é apagado.
        </p>
        {memAtiva && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="canal">Canal preferido</Label>
              <Select value={data?.pref?.canal_preferido ?? ""} onValueChange={(canal_preferido) => salvarPreferencia({ canal_preferido })}>
                <SelectTrigger id="canal"><SelectValue placeholder="Escolher canal" /></SelectTrigger>
                <SelectContent><SelectItem value="chat">Chat</SelectItem><SelectItem value="e-mail">E-mail</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linguagem">Nível de linguagem</Label>
              <Select value={data?.pref?.nivel_linguagem ?? ""} onValueChange={(nivel_linguagem) => salvarPreferencia({ nivel_linguagem })}>
                <SelectTrigger id="linguagem"><SelectValue placeholder="Escolher linguagem" /></SelectTrigger>
                <SelectContent><SelectItem value="simples">Simples</SelectItem><SelectItem value="detalhada">Detalhada</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="lembretes" checked={data?.pref?.lembretes_ativos ?? false} onCheckedChange={(lembretes_ativos) => salvarPreferencia({ lembretes_ativos })} />
              <Label htmlFor="lembretes">Preferência por lembretes</Label>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border-2 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Resumos guardados</h2>
          {!!data?.resumos.length && <Button variant="outline" onClick={() => apagarResumo()}>Apagar todos</Button>}
        </div>
        {data?.resumos.length ? (
          <ul className="mt-3 space-y-3">
            {data.resumos.map((r) => (
              <li key={r.id} className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-line text-lg">{r.resumo}</p>
                <p className="mt-1 text-muted-foreground">
                  Criado em {new Date(r.criado_em).toLocaleDateString("pt-BR")} · apagado automaticamente em {new Date(r.expira_em).toLocaleDateString("pt-BR")}
                </p>
                <Button variant="link" className="px-0" onClick={() => apagarResumo(r.id)}>Apagar este resumo</Button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-lg text-muted-foreground">Nenhum resumo guardado.</p>}
      </section>

      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Meus protocolos</h2>
        {data?.protocolos.length ? (
          <ul className="mt-3 space-y-2 text-lg">
            {data.protocolos.map((pr) => (
              <li key={pr.id} className="rounded-lg bg-muted p-3">
                <strong>{pr.tipo}</strong> – {pr.setor} – status: {pr.status}{pr.restrito && " (restrito)"}
                <br /><span className="text-muted-foreground">{new Date(pr.criado_em).toLocaleString("pt-BR")}</span>
                {pr.resposta && <p className="mt-2 rounded bg-card p-2"><strong>Resposta da equipe:</strong> {pr.resposta}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-lg text-muted-foreground">Nenhum protocolo ainda.</p>}
      </section>

      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Mapa de dados</h2>
        <dl className="mt-4 space-y-5 sm:hidden">
          {MAPA.map(([a, b, c]) => <div key={a} className="border-b pb-4"><dt className="font-bold">{a}</dt><dd className="mt-2">{b}</dd><dd className="mt-1 text-muted-foreground">{c}</dd></div>)}
        </dl>
        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-base">
            <caption className="sr-only">O que é guardado, para quê e por quanto tempo</caption>
            <thead><tr className="border-b-2"><th scope="col" className="p-2">O que guardamos</th><th scope="col" className="p-2">Para quê</th><th scope="col" className="p-2">Por quanto tempo</th></tr></thead>
            <tbody>{MAPA.map(([a, b, c]) => <tr key={a} className="border-b"><td className="p-2 font-semibold">{a}</td><td className="p-2">{b}</td><td className="p-2">{c}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 font-semibold">Suas conversas não são usadas para treinar modelos de IA nem para outras finalidades.</p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button onClick={baixar}>Baixar meus dados</Button>
        <Button variant="destructive" onClick={excluirConta}>Solicitar exclusão da conta</Button>
      </section>

      <section><PrivacyText /></section>
    </div>
  );
}
