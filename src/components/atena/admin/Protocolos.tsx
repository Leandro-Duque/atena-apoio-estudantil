import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STATUS = [["aberto", "Aberto"], ["em_andamento", "Em andamento"], ["concluido", "Concluído"]] as const;
const rotuloStatus = (s: string) => STATUS.find(([v]) => v === s)?.[1] ?? s;
const sel = "rounded-md border-2 border-input bg-background px-3 py-2 text-base";

export function Protocolos() {
  const qc = useQueryClient();
  const [setor, setSetor] = useState("");
  const [status, setStatus] = useState("");
  const { data: setores = [] } = useQuery({
    queryKey: ["meus-setores"],
    queryFn: async () => (await supabase.from("equipe_setores").select("setor")).data?.map((s) => s.setor) ?? [],
  });
  const { data: lista = [], isLoading } = useQuery({
    queryKey: ["admin-protocolos", setor, status],
    queryFn: async () => {
      let q = supabase.from("protocolos").select("id,tipo,status,setor,resumo,criado_em,prioridade,resposta,respondido_em,prazo_resposta").order("criado_em", { ascending: false }).limit(100);
      if (setor) q = q.eq("setor", setor);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return [...(data ?? [])].sort((a, b) => Number(b.tipo === "contestacao") - Number(a.tipo === "contestacao") || Number(b.prioridade === "alta") - Number(a.prioridade === "alta"));
    },
  });
  return (
    <div className="space-y-4">
      <p className="text-base text-muted-foreground">Você vê apenas protocolos dos seus setores: {setores.length ? setores.join(", ") : "nenhum setor atribuído"}.</p>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1"><Label htmlFor="f-setor">Setor</Label>
          <select id="f-setor" className={sel} value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="">Todos os meus setores</option>{setores.map((s) => <option key={s}>{s}</option>)}
          </select></div>
        <div className="flex flex-col gap-1"><Label htmlFor="f-status">Status</Label>
          <select id="f-status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>
      {isLoading ? <p>Carregando…</p> : lista.length === 0 ? <p className="text-muted-foreground">Nenhum protocolo com esses filtros.</p> : (
        <ul className="space-y-3">{lista.map((p) => <Item key={p.id} p={p} onSalvo={() => qc.invalidateQueries({ queryKey: ["admin-protocolos"] })} />)}</ul>
      )}
    </div>
  );
}

type P = { id: string; tipo: string; status: string; setor: string; resumo: string; criado_em: string; prioridade: string; resposta: string | null; prazo_resposta: string | null };
function Item({ p, onSalvo }: { p: P; onSalvo: () => void }) {
  const [resposta, setResposta] = useState(p.resposta ?? "");
  const [status, setStatus] = useState(p.status);
  const [salvando, setSalvando] = useState(false);
  const contest = p.tipo === "contestacao";
  const atrasado = contest && p.prazo_resposta && p.status !== "concluido" && p.prazo_resposta < new Date().toISOString().slice(0, 10);
  return (
    <li className={`rounded-xl border-2 p-4 ${contest ? "border-destructive bg-destructive/5" : "bg-card"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {contest && <span className="rounded bg-destructive px-2 py-1 text-sm font-bold text-destructive-foreground">CONTESTAÇÃO</span>}
        {p.prioridade === "alta" && <span className="rounded bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">Prioridade alta</span>}
        <strong className="text-lg">{p.tipo}</strong><span>· {p.setor} · {rotuloStatus(p.status)}</span>
        <span className="text-sm text-muted-foreground">· aberto em {new Date(p.criado_em).toLocaleDateString("pt-BR")}</span>
      </div>
      {contest && p.prazo_resposta && <p className={`mt-1 font-semibold ${atrasado ? "text-destructive" : ""}`}>Prazo de resposta (3 dias úteis): {new Date(p.prazo_resposta + "T12:00").toLocaleDateString("pt-BR")}{atrasado ? " — atrasado" : ""}</p>}
      <p className="mt-2">{p.resumo}</p>
      <div className="mt-3 grid gap-2">
        <Label htmlFor={`r-${p.id}`}>Resposta ao estudante</Label>
        <Textarea id={`r-${p.id}`} value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Escreva a resposta que o estudante verá em Meus dados." />
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1"><Label htmlFor={`s-${p.id}`}>Status</Label>
            <select id={`s-${p.id}`} className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <Button disabled={salvando} onClick={async () => {
            setSalvando(true);
            const { error } = await supabase.from("protocolos").update({ status, resposta: resposta.trim() || null }).eq("id", p.id);
            setSalvando(false);
            if (error) toast.error("Não foi possível salvar."); else { toast.success("Protocolo atualizado."); onSalvo(); }
          }}>{salvando ? "Salvando…" : "Salvar"}</Button>
        </div>
      </div>
    </li>
  );
}
