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
          As mensagens da conversa (só as últimas 10) são apagadas quando a conversa ou a sessão termina. Fica
          apenas um resumo de até 3 linhas, sem dados sensíveis, guardado por 90 dias e apagado automaticamente.
          Preferências (como canal preferido) só são lembradas se você ligar essa opção. Protocolos de
          atendimento ficam guardados por até 5 anos, como registro administrativo.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Dados pessoais e sensíveis</h2>
        <p>
          CPF, telefone, e-mail e números de documento são escondidos antes de qualquer resumo ou registro ser
          gravado. Informações de saúde ou deficiência nunca entram nos resumos nem nas preferências: só aparecem
          em um protocolo restrito, visto apenas pelo setor responsável.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Nenhum outro uso</h2>
        <p>
          Suas conversas <strong>não são usadas para treinar modelos de IA</strong> nem para qualquer outra
          finalidade além de orientar e encaminhar você.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">O que a Atena NÃO faz</h2>
        <p>Ela não concede, nega nem altera benefícios, notas ou matrícula. Quem decide é sempre a equipe da universidade.</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Como pedir a exclusão</h2>
        <p>
          Na área <strong>“Meus dados e privacidade”</strong>, você pode apagar seus resumos ou clicar em “Solicitar exclusão da conta”. Você
          também pode escrever para <strong>privacidade@exemplo.edu.br</strong>. Respondemos em até 15 dias.
        </p>
      </section>
    </div>
  );
}
