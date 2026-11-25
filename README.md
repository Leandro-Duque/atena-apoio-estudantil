# Atena Apoio Estudantil

Crie um aplicativo web em português do Brasil chamado "Atena", um assistente de IA de permanência estudantil para uma universidade fictícia chamada "Universidade Exemplo".

Objetivo: orientar estudantes sobre calendário acadêmico, trancamento de matrícula, aproveitamento de disciplinas e editais de auxílios e bolsas, e encaminhar para atendimento humano. A Atena ORIENTA e ENCAMINHA. Ela NUNCA concede, nega ou altera benefícios, notas ou matrícula.

Páginas:
1. Tela inicial com explicação curta do que a Atena faz e NÃO faz, e botão "Conversar com a Atena".
2. Aviso de privacidade em linguagem simples, exibido antes da primeira conversa, com checkbox de ciência e botão "Continuar". Deve dizer claramente: "Você está falando com uma IA", quais dados são tratados, para quê, por quanto tempo, e como pedir exclusão.
3. Tela de chat (será detalhada no próximo passo).
4. Área "Meus dados e privacidade".
5. Painel administrativo, restrito a usuários com papel "equipe" (detalhado depois).

Design: visual acolhedor e acessível, cores azul e verde, fonte grande e legível, contraste alto, funciona bem no celular, navegação por teclado, textos alternativos. Use componentes simples.

Autenticação: login com e-mail. Dois papéis: "estudante" e "equipe". Para o protótipo, use matrícula e curso fictícios cadastrados no perfil.

Banco de dados (crie as tabelas): perfis, documentos_oficiais (título, tipo, texto, data_vigencia, fonte), conversas, mensagens, protocolos (tipo, status, setor, resumo, criado_em), feedbacks, logs_acoes. Ative regras de acesso por linha para que cada estudante veja apenas seus próprios dados.

Popule documentos_oficiais com 6 documentos FICTÍCIOS: calendário acadêmico 2026/2, regras de trancamento, regras de aproveitamento de disciplinas, edital de auxílio alimentação 03/2026 (com prazo e requisitos), edital de bolsa de permanência 04/2026 e um guia dos serviços de apoio (assistência estudantil, acessibilidade, acolhimento psicológico).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/236bd75d-c303-41dd-b6ea-a15804104fc2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
