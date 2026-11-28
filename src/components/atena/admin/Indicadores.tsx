import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Barras } from "./Barras";

type Ind = { conversas: number; temas: { tema: string; total: number }[]; pedidos_humanos: number; taxa_humano: number | null; feedbacks: number; taxa_nao_util: number | null; tempo_medio_horas: number | null; contestacoes: number };

export function Indicadores() {
  const { data, error } = useQuery({
    queryKey: ["painel-indicadores"],
    queryFn: async () => { const { data, error } = await supabase.rpc("painel_indicadores"); if (error) throw error; return data as unknown as Ind; },
  });
  if (error) return <p role="alert">Não foi possível carregar os indicadores.</p>;
  if (!data) return <p>Carregando…</p>;
  const pct = (v: number | null) => (v === null ? "sem dados" : `${v}%`);
  const cards = [
    ["Conversas", String(data.conversas)], ["Pedidos de atendimento humano", `${data.pedidos_humanos} (${pct(data.taxa_humano)})`],
    ['Feedback "Não útil"', pct(data.taxa_nao_util)], ["Tempo médio de resposta humana", data.tempo_medio_horas === null ? "sem dados" : `${data.tempo_medio_horas} h`],
    ["Contestações", String(data.contestacoes)],
  ];
  return (
    <div className="space-y-6">
      <p className="rounded-md bg-muted p-3">Somente números agregados e anônimos. Nenhum nome ou lista de estudantes é exibido, e a Atena não envia alertas individuais de risco de evasão: contato individual só acontece se o estudante aceitar no chat.</p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([k, v]) => <div key={k} className="rounded-xl border-2 bg-card p-4"><dt className="text-base text-muted-foreground">{k}</dt><dd className="text-2xl font-bold text-primary">{v}</dd></div>)}
      </dl>
      <section className="rounded-xl border-2 bg-card p-4"><h3 className="mb-3 text-xl font-bold">Temas mais frequentes</h3>
        <Barras itens={data.temas.map((t) => ({ rotulo: t.tema, valor: t.total }))} /></section>
      <section className="rounded-xl border-2 bg-card p-4"><h3 className="mb-3 text-xl font-bold">Taxas (%)</h3>
        <Barras sufixo="%" itens={[{ rotulo: "Pedidos de atendimento humano por conversa", valor: data.taxa_humano }, { rotulo: 'Feedback "Não útil"', valor: data.taxa_nao_util }]} /></section>
    </div>
  );
}
