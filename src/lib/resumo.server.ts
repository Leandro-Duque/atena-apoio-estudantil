import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

/** Entrada e saída só contêm categorias permitidas, nunca transcrições ou identificadores. */
export async function selecionarTemas(temas: string[]): Promise<string[]> {
  try {
    const r = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: "Selecione os temas acadêmicos relevantes. Responda apenas com os temas fornecidos, um por linha, sem acrescentar nada.",
      input: temas.join("\n"),
    });
    if (r.status !== "completed") throw new Error("Resumo não concluído.");
    const texto = r.output.flatMap((o) => o.type === "message" ? o.content : [])
      .flatMap((c) => c.type === "output_text" ? [c.text] : []).join("\n");
    const selecionados = temas.filter((t) => texto.includes(t));
    return selecionados.length ? selecionados : temas;
  } catch (e) {
    if (e instanceof GatewayError) console.error("resumo", e.code);
    // As categorias já são suficientes para gerar um resumo seguro, sem inventar fatos.
    return temas;
  }
}
