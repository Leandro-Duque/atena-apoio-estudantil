import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const vazio = { decisao: "", alternativas_descartadas: "", riscos: "", responsavel: "", data: new Date().toISOString().slice(0, 10) };

export function Decisoes() {
  const qc = useQueryClient();
  const [f, setF] = useState(vazio);
  const { data = [] } = useQuery({
    queryKey: ["decisoes"],
    queryFn: async () => (await supabase.from("decisoes_design").select("*").order("data", { ascending: false })).data ?? [],
  });
  const campo = (k: keyof typeof vazio, rot: string, area = true) => (
    <div className="grid gap-1"><Label htmlFor={`d-${k}`}>{rot}</Label>
      {area ? <Textarea id={`d-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        : <Input id={`d-${k}`} type={k === "data" ? "date" : "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}</div>
  );
  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded-xl border-2 bg-card p-4" onSubmit={async (e) => {
        e.preventDefault();
        if (!f.decisao.trim() || !f.responsavel.trim()) return toast.error("Preencha a decisão e o responsável.");
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("decisoes_design").insert({ ...f, criado_por: u.user?.id ?? null });
        if (error) return toast.error("Não foi possível salvar.");
        toast.success("Decisão registrada."); setF(vazio); qc.invalidateQueries({ queryKey: ["decisoes"] });
      }}>
        <h3 className="text-xl font-bold">Nova decisão</h3>
        {campo("decisao", "O que foi decidido")}{campo("alternativas_descartadas", "Alternativas descartadas")}{campo("riscos", "Riscos")}
        <div className="grid gap-3 sm:grid-cols-2">{campo("responsavel", "Responsável", false)}{campo("data", "Data", false)}</div>
        <Button type="submit" className="justify-self-start">Registrar decisão</Button>
      </form>
      <ul className="space-y-3">{data.map((d) => (
        <li key={d.id} className="rounded-xl border-2 bg-card p-4">
          <p className="text-lg font-bold">{d.decisao}</p>
          <p><strong>Alternativas descartadas:</strong> {d.alternativas_descartadas || "—"}</p>
          <p><strong>Riscos:</strong> {d.riscos || "—"}</p>
          <p className="text-muted-foreground">{d.responsavel} · {new Date(d.data + "T12:00").toLocaleDateString("pt-BR")}</p>
        </li>))}</ul>
    </div>
  );
}
