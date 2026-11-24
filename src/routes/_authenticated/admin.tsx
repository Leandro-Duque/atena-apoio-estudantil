import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isEquipe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    if (!(await isEquipe(context.userId))) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Painel da equipe – Atena" },
      { name: "description", content: "Área restrita da equipe de permanência estudantil." },
      { property: "og:title", content: "Painel da equipe – Atena" },
      { property: "og:description", content: "Área restrita." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data } = useQuery({
    queryKey: ["admin-resumo"],
    queryFn: async () => {
      const [docs, prot] = await Promise.all([
        supabase.from("documentos_oficiais").select("id,titulo,tipo,data_vigencia").order("titulo"),
        supabase.from("protocolos").select("*").order("criado_em", { ascending: false }).limit(20),
      ]);
      return { docs: docs.data ?? [], prot: prot.data ?? [] };
    },
  });
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Painel da equipe</h1>
      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Documentos oficiais</h2>
        <ul className="mt-3 space-y-1 text-lg">
          {data?.docs.map((d) => <li key={d.id}>{d.titulo} <span className="text-muted-foreground">({d.tipo}, vigência {d.data_vigencia})</span></li>)}
        </ul>
      </section>
      <section className="rounded-xl border-2 bg-card p-6">
        <h2 className="text-2xl font-bold">Protocolos recentes</h2>
        {data?.prot.length ? (
          <ul className="mt-3 space-y-2 text-lg">
            {data.prot.map((p) => <li key={p.id} className="rounded bg-muted p-3"><strong>{p.tipo}</strong> – {p.setor} – {p.status}<br />{p.resumo}</li>)}
          </ul>
        ) : <p className="mt-2 text-muted-foreground">Nenhum protocolo.</p>}
      </section>
    </div>
  );
}
