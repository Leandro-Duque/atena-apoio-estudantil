import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registrarLog } from "@/lib/auth";
import { PrivacyText } from "@/components/atena/PrivacyText";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/meus-dados")({
  head: () => ({
    meta: [
      { title: "Meus dados e privacidade – Atena" },
      { name: "description", content: "Veja, baixe ou peça a exclusão dos seus dados." },
      { property: "og:title", content: "Meus dados e privacidade – Atena" },
      { property: "og:description", content: "Controle dos seus dados na Atena." },
    ],
  }),
  component: MeusDados,
});

function MeusDados() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["meus-dados", userId],
    queryFn: async () => {
      const [perfil, conversas, protocolos] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", userId).maybeSingle(),
        supabase.from("conversas").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("protocolos").select("*").eq("user_id", userId).order("criado_em", { ascending: false }),
      ]);
      return { perfil: perfil.data, nConversas: conversas.count ?? 0, protocolos: protocolos.data ?? [] };
    },
  });

  async function baixar() {
    const [perfil, conversas, mensagens, protocolos, feedbacks] = await Promise.all([
      supabase.from("perfis").select("*").eq("id", userId),
      supabase.from("conversas").select("*").eq("user_id", userId),
      supabase.from("mensagens").select("*").eq("user_id", userId),
      supabase.from("protocolos").select("*").eq("user_id", userId),
      supabase.from("feedbacks").select("*").eq("user_id", userId),
    ]);
    const blob = new Blob([JSON.stringify({ perfil: perfil.data, conversas: conversas.data, mensagens: mensagens.data, protocolos: protocolos.data, feedbacks: feedbacks.data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meus-dados-atena.json";
    a.click();
    await registrarLog("download_dados");
  }

  async function pedirExclusao() {
    if (!window.confirm("Confirmar o pedido de exclusão dos seus dados?")) return undefined;
    const { error } = await supabase.from("protocolos").insert({
      user_id: userId, tipo: "exclusao_dados", setor: "Encarregado de Dados (LGPD)",
      resumo: "Estudante solicitou a exclusão dos seus dados pessoais.",
    });
    if (error) { toast.error("Não foi possível registrar o pedido."); return; }
    await registrarLog("pedido_exclusao");
    toast.success("Pedido registrado. Responderemos em até 15 dias.");
    qc.invalidateQueries({ queryKey: ["meus-dados", userId] });
  }

  const p = data?.perfil;
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Meus dados e privacidade</h1>
      <section className="rounded-xl border-2 bg-card p-6 shadow-soft">
        <h2 className="text-2xl font-bold">Meu perfil</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-lg">
          <dt className="font-semibold">Nome</dt><dd>{p?.nome}</dd>
          <dt className="font-semibold">E-mail</dt><dd>{p?.email}</dd>
          <dt className="font-semibold">Matrícula</dt><dd>{p?.matricula} (fictícia)</dd>
          <dt className="font-semibold">Curso</dt><dd>{p?.curso}</dd>
          <dt className="font-semibold">Conversas</dt><dd>{data?.nConversas ?? 0}</dd>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={baixar}>Baixar meus dados</Button>
          <Button variant="destructive" onClick={pedirExclusao}>Pedir exclusão dos meus dados</Button>
        </div>
      </section>
      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Meus protocolos</h2>
        {data?.protocolos.length ? (
          <ul className="mt-3 space-y-2 text-lg">
            {data.protocolos.map((pr) => (
              <li key={pr.id} className="rounded-lg bg-muted p-3">
                <strong>{pr.tipo}</strong> – {pr.setor} – status: {pr.status}
                <br /><span className="text-muted-foreground">{new Date(pr.criado_em).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-lg text-muted-foreground">Nenhum protocolo ainda.</p>}
      </section>
      <section><PrivacyText /></section>
    </div>
  );
}
