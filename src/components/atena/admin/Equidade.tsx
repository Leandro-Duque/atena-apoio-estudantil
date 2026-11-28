import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { diferencaPP, precisaAlerta, LIMITE_PP, type Grupo } from "@/lib/equidade";
import { Barras } from "./Barras";

const DIMS = [["curso", "Curso"], ["turno", "Turno"], ["modalidade", "Modalidade (presencial/EAD)"]] as const;
const METRICAS = [["taxa_nao_util", 'Taxa de "Não útil"'], ["taxa_contestacao", "Taxa de contestações por conversa"]] as const;

export function Equidade() {
  const { data, error } = useQuery({
    queryKey: ["painel-equidade"],
    queryFn: async () => { const { data, error } = await supabase.rpc("painel_equidade"); if (error) throw error; return data as unknown as Record<string, Grupo[]>; },
  });
  if (error) return <p role="alert">Não foi possível carregar a comparação.</p>;
  if (!data) return <p>Carregando…</p>;
  return (
    <div className="space-y-6">
      <p className="rounded-md bg-muted p-3">Comparação entre grupos para detectar se a Atena atende pior algum grupo. Alerta quando a diferença passa de {LIMITE_PP} pontos percentuais. Grupos com menos de 3 estudantes ficam ocultos para evitar identificação.</p>
      {DIMS.map(([dim, nome]) => {
        const grupos = data[dim] ?? [];
        return (
          <section key={dim} className="rounded-xl border-2 bg-card p-4">
            <h3 className="mb-3 text-xl font-bold">{nome}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {METRICAS.map(([m, rot]) => {
                const d = diferencaPP(grupos, m);
                return (
                  <div key={m}>
                    <h4 className="mb-2 font-semibold">{rot}</h4>
                    {precisaAlerta(d) && <p role="alert" className="mb-2 rounded-md border-2 border-destructive bg-destructive/10 p-2 font-semibold text-destructive">Alerta: diferença de {d} pontos percentuais entre grupos.</p>}
                    {d !== null && !precisaAlerta(d) && <p className="mb-2 text-sm text-muted-foreground">Diferença entre grupos: {d} p.p.</p>}
                    <Barras sufixo="%" itens={grupos.map((g) => ({ rotulo: g.ocultado ? `${g.grupo} (amostra pequena, oculto)` : g.grupo, valor: g[m] }))} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
