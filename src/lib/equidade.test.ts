import { describe, it, expect } from "vitest";
import { diferencaPP, precisaAlerta, type Grupo } from "./equidade";
const g = (grupo: string, nu: number | null, ocultado = false): Grupo => ({ grupo, estudantes: 5, ocultado, taxa_nao_util: nu, taxa_contestacao: null });
describe("equidade", () => {
  it("alerta acima de 10 pontos", () => expect(precisaAlerta(diferencaPP([g("A", 10), g("B", 20.5)], "taxa_nao_util"))).toBe(true));
  it("sem alerta com exatamente 10 pontos", () => expect(precisaAlerta(diferencaPP([g("A", 10), g("B", 20)], "taxa_nao_util"))).toBe(false));
  it("ignora grupos ocultados por amostra pequena", () => expect(diferencaPP([g("A", 0), g("B", 50, true)], "taxa_nao_util")).toBeNull());
});
