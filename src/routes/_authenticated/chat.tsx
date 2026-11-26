import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { criarMemoriaCurta } from "@/lib/memoria-curta";
import { abrirProtocolo, encerrarConversa, registrarFeedback } from "@/lib/memoria.functions";
import { detectarUrgencia, sugereAtendimento, type NivelUrgencia } from "@/lib/chat-regras";

export const Route = createFileRoute("/_authenticated/chat")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("perfis").select("aceite_privacidade_em").eq("id", context.userId).maybeSingle();
    if (!data?.aceite_privacidade_em) throw redirect({ to: "/aviso" });
  },
  head: () => ({
    meta: [
      { title: "Conversar com a Atena" },
      { name: "description", content: "Converse com a Atena sobre calendário, trancamento, aproveitamento e auxílios." },
      { property: "og:title", content: "Conversar com a Atena" },
      { property: "og:description", content: "Assistente de IA de permanência estudantil da Universidade Exemplo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chat,
});

type Fonte = { titulo: string; vigencia: string | null };
type Item = {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
  fontes?: Fonte[];
  urgencia?: NivelUrgencia;
  avaliado?: boolean;
  pronto?: boolean;
};
type Pedido = { tipo: "atendimento" | "contestacao" | "urgencia"; texto: string } | null;

const SETOR = { atendimento: "Assistência Estudantil", contestacao: "Assistência Estudantil", urgencia: "Acolhimento Psicológico" } as const;

function Contatos({ destaque }: { destaque: boolean }) {
  return (
    <div className={`mt-3 rounded-lg border-2 p-4 ${destaque ? "border-destructive bg-destructive/10" : "border-secondary bg-secondary/10"}`}>
      <p className="font-bold">Contatos de apoio</p>
      <ul className="mt-2 space-y-1">
        {destaque && <li className="text-xl font-bold">Emergência: SAMU <a className="underline" href="tel:192">192</a> · Bombeiros <a className="underline" href="tel:193">193</a></li>}
        <li className={destaque ? "text-xl font-bold" : "font-semibold"}>CVV (24h, gratuito): <a className="underline" href="tel:188">188</a></li>
        <li>Acolhimento Psicológico da Universidade Exemplo (fictício): <a className="underline" href="tel:+551100000000">(11) 0000-0000</a>, Bloco C, sala 12, seg. a sex., 8h–20h.</li>
      </ul>
    </div>
  );
}

function Chat() {
  const memoria = useRef(criarMemoriaCurta());
  const conversaId = useRef<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState<Pedido>(null);
  const abrir = useServerFn(abrirProtocolo);
  const avaliar = useServerFn(registrarFeedback);
  const encerrar = useServerFn(encerrarConversa);

  useEffect(() => {
    const m = memoria.current;
    return () => m.encerrar();
  }, []);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [itens]);

  const atualizar = (id: string, p: Partial<Item>) => setItens((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i)));

  async function garantirConversa(userId: string) {
    if (conversaId.current) return conversaId.current;
    const { data, error } = await supabase.from("conversas").insert({ user_id: userId, titulo: "Conversa com a Atena" }).select("id").single();
    if (error) throw error;
    conversaId.current = data.id;
    return data.id;
  }

  async function enviar(e?: React.FormEvent) {
    e?.preventDefault();
    const msg = texto.trim();
    if (!msg || enviando) return;
    setTexto("");
    setEnviando(true);
    const idU = crypto.randomUUID();
    const idA = crypto.randomUUID();
    memoria.current.adicionar({ papel: "user", conteudo: msg });
    setItens((l) => [...l, { id: idU, papel: "user", conteudo: msg }]);
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) throw new Error("Sessão expirada.");
      await garantirConversa(s.session.user.id);
      const urgLocal = detectarUrgencia(msg);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${s.session.access_token}` },
        body: JSON.stringify({ mensagens: memoria.current.ler() }),
      });
      if (res.headers.get("content-type")?.includes("application/json") || urgLocal !== "nenhum") {
        const j = (await res.json().catch(() => ({}))) as { urgencia?: NivelUrgencia };
        const nivel = j.urgencia ?? urgLocal;
        const acolhe = nivel === "iminente"
          ? "Sinto muito que você esteja passando por isso. Sua vida importa. Se você corre risco agora, ligue imediatamente para os números abaixo. Você não precisa enfrentar isso sozinho(a)."
          : "Obrigada por me contar. Sinto muito que esteja sendo tão difícil. Vamos pausar as dúvidas acadêmicas por um momento. Posso pedir que a equipe de acolhimento entre em contato com você com prioridade, se você concordar.";
        memoria.current.adicionar({ papel: "assistant", conteudo: acolhe });
        setItens((l) => [...l, { id: idA, papel: "assistant", conteudo: acolhe, urgencia: nivel, pronto: true }]);
        if (nivel === "sofrimento") setPedido({ tipo: "urgencia", texto: "Pedir contato prioritário da equipe de acolhimento?" });
        return;
      }
      if (!res.ok || !res.body) throw new Error(await res.text());
      let fontes: Fonte[] = [];
      try { fontes = JSON.parse(decodeURIComponent(res.headers.get("x-fontes") ?? "[]")); } catch { fontes = []; }
      setItens((l) => [...l, { id: idA, papel: "assistant", conteudo: "", fontes }]);
      const leitor = res.body.getReader();
      const dec = new TextDecoder();
      let total = "";
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        total += dec.decode(value, { stream: true });
        atualizar(idA, { conteudo: total });
      }
      memoria.current.adicionar({ papel: "assistant", conteudo: total });
      atualizar(idA, { pronto: true });
      if (!fontes.length || sugereAtendimento(total)) setPedido({ tipo: "atendimento", texto: "Quer que eu abra um protocolo de atendimento com a equipe?" });
    } catch (err) {
      const m = err instanceof Error && err.message ? err.message : "Não consegui responder agora.";
      setItens((l) => [...l, { id: idA, papel: "assistant", conteudo: `${m} Você pode tentar de novo ou falar com uma pessoa.`, pronto: true }]);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarProtocolo() {
    if (!pedido) return;
    const ultimas = memoria.current.ler().filter((m) => m.papel === "user").slice(-2).map((m) => m.conteudo).join("\n");
    try {
      await abrir({ data: { tipo: pedido.tipo, setor: SETOR[pedido.tipo], resumo: ultimas || "Pedido feito pelo chat." } });
      toast.success(pedido.tipo === "urgencia" ? "Pedido prioritário enviado ao acolhimento." : "Protocolo aberto. A equipe vai entrar em contato.");
      setPedido(null);
    } catch {
      toast.error("Não foi possível abrir o protocolo.");
    }
  }

  async function darFeedback(id: string, util: boolean) {
    try {
      await avaliar({ data: { util } });
      atualizar(id, { avaliado: true });
      toast.success("Obrigada pela avaliação.");
    } catch { toast.error("Não foi possível registrar a avaliação."); }
  }

  async function finalizar() {
    const id = conversaId.current;
    try {
      if (id) await encerrar({ data: { conversaId: id, mensagens: memoria.current.ler() } });
      toast.success(id ? "Conversa encerrada. Guardamos só um resumo sem dados pessoais." : "Conversa encerrada.");
    } catch { toast.error("Não foi possível salvar o resumo."); }
    memoria.current.encerrar();
    memoria.current = criarMemoriaCurta();
    conversaId.current = null;
    setItens([]);
    setPedido(null);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 pb-40 pt-4">
      <p role="note" className="sticky top-0 z-10 rounded-md border border-primary/40 bg-muted px-3 py-2 text-center text-sm font-semibold text-primary">
        Você está conversando com uma IA. As orientações são preliminares.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-primary">Conversa com a Atena</h1>
        <Button variant="outline" onClick={finalizar} disabled={enviando}>Encerrar conversa</Button>
      </div>

      <div aria-live="polite" className="mt-6 space-y-4">
        {itens.length === 0 && (
          <p className="text-lg text-muted-foreground">Pergunte sobre calendário acadêmico, trancamento, aproveitamento de disciplinas ou editais de auxílios e bolsas.</p>
        )}
        {itens.map((i) => i.papel === "user" ? (
          <div key={i.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-lg text-primary-foreground">
            <span className="sr-only">Você: </span>{i.conteudo}
          </div>
        ) : (
          <article key={i.id} className="max-w-[95%] text-lg">
            <p className="text-sm font-bold text-secondary">Atena (IA)</p>
            <div className="whitespace-pre-wrap">{i.conteudo || "Pensando…"}</div>
            {i.urgencia && i.urgencia !== "nenhum" && <Contatos destaque={i.urgencia === "iminente"} />}
            {i.pronto && !!i.fontes?.length && (
              <aside className="mt-3 rounded-lg border-l-4 border-secondary bg-muted p-3 text-base">
                <p className="font-bold">Fonte</p>
                <ul>{i.fontes.map((f) => <li key={f.titulo}>{f.titulo} — vigência {f.vigencia ? new Date(f.vigencia + "T12:00").toLocaleDateString("pt-BR") : "não informada"}</li>)}</ul>
              </aside>
            )}
            {i.pronto && !i.urgencia && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={i.avaliado} onClick={() => darFeedback(i.id, true)}>Útil</Button>
                <Button size="sm" variant="outline" disabled={i.avaliado} onClick={() => darFeedback(i.id, false)}>Não útil</Button>
                <Button size="sm" variant="ghost" onClick={() => setPedido({ tipo: "contestacao", texto: "Abrir um protocolo para contestar esta orientação? Uma pessoa da equipe vai revisar." })}>Contestar esta orientação</Button>
              </div>
            )}
          </article>
        ))}
        {pedido && (
          <div role="alertdialog" aria-label="Confirmar protocolo" className="rounded-lg border-2 border-primary bg-card p-4">
            <p className="font-semibold">{pedido.texto}</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={confirmarProtocolo}>Sim, abrir protocolo</Button>
              <Button variant="ghost" onClick={() => setPedido(null)}>Agora não</Button>
            </div>
          </div>
        )}
        <div ref={fim} />
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur">
        <form onSubmit={enviar} className="mx-auto flex max-w-3xl flex-col gap-2">
          <label htmlFor="msg" className="sr-only">Sua mensagem</label>
          <Textarea id="msg" rows={2} value={texto} maxLength={2000} placeholder="Escreva sua dúvida…" className="text-lg"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); } }} />
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setPedido({ tipo: "atendimento", texto: "Quer falar com uma pessoa? Vou abrir um protocolo de atendimento." })}>Falar com uma pessoa</Button>
            <Button type="submit" disabled={enviando || !texto.trim()}>{enviando ? "Enviando…" : "Enviar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
