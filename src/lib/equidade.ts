export const LIMITE_PP = 10;
export type Grupo = { grupo: string; estudantes: number; ocultado: boolean; taxa_nao_util: number | null; taxa_contestacao: number | null };

/** Diferença (pontos percentuais) entre o maior e o menor grupo com dados; null se < 2 grupos. */
export function diferencaPP(grupos: Grupo[], campo: "taxa_nao_util" | "taxa_contestacao"): number | null {
  const v = grupos.filter((g) => !g.ocultado).map((g) => g[campo]).filter((x): x is number => x !== null);
  if (v.length < 2) return null;
  return Math.round((Math.max(...v) - Math.min(...v)) * 10) / 10;
}

export const precisaAlerta = (d: number | null) => d !== null && d > LIMITE_PP;
