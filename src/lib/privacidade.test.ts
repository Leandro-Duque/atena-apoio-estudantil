import { describe, it, expect } from "vitest";
import { mascarar, limparResumo, contemDadoSensivel, ultimasMensagens } from "./privacidade";

describe("privacidade", () => {
  it("mascara CPF", () => expect(mascarar("meu cpf 123.456.789-09")).toBe("meu cpf [cpf]"));
  it("mascara e-mail", () => expect(mascarar("escreva a ana@x.com")).toBe("escreva a [e-mail]"));
  it("mascara telefone", () => expect(mascarar("ligue (11) 98765-4321")).toBe("ligue [telefone]"));
  it("mascara número de documento", () => expect(mascarar("RG 1234567")).toBe("RG [documento]"));
  it("detecta saúde e deficiência", () => {
    expect(contemDadoSensivel("tenho depressão")).toBe(true);
    expect(contemDadoSensivel("sou pessoa com deficiência")).toBe(true);
    expect(contemDadoSensivel("quero trancar a matrícula")).toBe(false);
  });
  it("resumo sem sensíveis e com no máximo 3 linhas", () => {
    const r = limparResumo("Tema: trancamento\nRenda familiar baixa\nProtocolo: aberto\nPendências: enviar ementa\nextra");
    expect(r.split("\n")).toEqual(["Tema: trancamento", "Protocolo: aberto", "Pendências: enviar ementa"]);
  });
  it("memória curta guarda só 10 mensagens", () => {
    expect(ultimasMensagens(Array.from({ length: 15 }, (_, i) => i))).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
});
