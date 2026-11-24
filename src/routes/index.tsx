import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atena – Assistente de permanência estudantil | Universidade Exemplo" },
      { name: "description", content: "A Atena orienta estudantes sobre calendário, trancamento, aproveitamento, auxílios e bolsas, e encaminha para atendimento humano." },
      { property: "og:title", content: "Atena – Assistente de permanência estudantil" },
      { property: "og:description", content: "Orientação e encaminhamento para estudantes da Universidade Exemplo." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="font-semibold text-accent">Universidade Exemplo</p>
          <h1 className="mt-2 text-4xl font-bold text-primary md:text-5xl">Olá! Eu sou a Atena.</h1>
          <p className="mt-4 max-w-2xl text-xl">
            Sou uma assistente de inteligência artificial. Ajudo você a entender as regras da universidade e indico
            com quem falar quando precisar de uma pessoa.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/chat">Conversar com a Atena</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        <div className="rounded-xl border-2 border-accent bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-accent">O que a Atena faz</h2>
          <ul className="mt-3 ml-6 list-disc space-y-1 text-lg">
            <li>Explica o calendário acadêmico</li>
            <li>Orienta sobre trancamento de matrícula</li>
            <li>Explica o aproveitamento de disciplinas</li>
            <li>Mostra prazos e requisitos de auxílios e bolsas</li>
            <li>Encaminha você para atendimento humano</li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-destructive bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-destructive">O que a Atena NÃO faz</h2>
          <ul className="mt-3 ml-6 list-disc space-y-1 text-lg">
            <li>Não concede nem nega benefícios</li>
            <li>Não altera notas</li>
            <li>Não muda sua matrícula</li>
            <li>Não substitui a equipe da universidade</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
