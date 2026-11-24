export function PrivacyText() {
  return (
    <div className="space-y-5 text-lg">
      <p className="rounded-lg border-2 border-primary bg-muted p-4 text-xl font-bold text-primary" role="note">
        Você está falando com uma IA. A Atena é um programa de computador, não uma pessoa.
      </p>
      <section>
        <h2 className="text-xl font-bold">Quais dados tratamos</h2>
        <ul className="ml-6 list-disc">
          <li>Seu nome, e-mail, matrícula e curso (do seu perfil).</li>
          <li>As mensagens que você escreve para a Atena e as respostas dela.</li>
          <li>Pedidos de atendimento (protocolos) e avaliações que você enviar.</li>
          <li>Registros de ações no sistema, como entrar e sair.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold">Para quê</h2>
        <p>
          Para orientar você sobre calendário, trancamento, aproveitamento de disciplinas, auxílios e bolsas, e
          para encaminhar seu caso a uma pessoa da equipe quando necessário. Não usamos seus dados para
          propaganda.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Por quanto tempo</h2>
        <p>
          Conversas ficam guardadas por até 12 meses. Protocolos de atendimento ficam guardados por até 5 anos,
          como registro administrativo. Depois disso, são apagados.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">O que a Atena NÃO faz</h2>
        <p>Ela não concede, nega nem altera benefícios, notas ou matrícula. Quem decide é sempre a equipe da universidade.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Como pedir a exclusão</h2>
        <p>
          Na área <strong>“Meus dados e privacidade”</strong>, clique em “Pedir exclusão dos meus dados”. Você
          também pode escrever para <strong>privacidade@exemplo.edu.br</strong>. Respondemos em até 15 dias.
        </p>
      </section>
    </div>
  );
}
