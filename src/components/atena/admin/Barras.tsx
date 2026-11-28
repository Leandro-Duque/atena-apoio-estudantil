export function Barras({ itens, sufixo = "" }: { itens: { rotulo: string; valor: number | null }[]; sufixo?: string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor ?? 0));
  return (
    <ul className="space-y-2">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex justify-between text-base"><span>{i.rotulo}</span><strong>{i.valor === null ? "sem dados" : `${i.valor}${sufixo}`}</strong></div>
          <div className="h-4 rounded bg-muted" aria-hidden="true"><div className="h-4 rounded bg-primary" style={{ width: `${((i.valor ?? 0) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
