import { ultimasMensagens } from "./privacidade";

export type MensagemTemporaria = { papel: "user" | "assistant"; conteudo: string };

/** Uma instância por conversa no navegador. Não usa armazenamento persistente. */
export function criarMemoriaCurta() {
  let mensagens: MensagemTemporaria[] = [];
  return {
    adicionar(mensagem: MensagemTemporaria) {
      mensagens = ultimasMensagens([...mensagens, mensagem]);
    },
    ler() { return mensagens.map((m) => ({ ...m })); },
    encerrar() { mensagens = []; },
  };
}