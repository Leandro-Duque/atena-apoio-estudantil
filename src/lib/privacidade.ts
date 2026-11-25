// Regras de privacidade da Atena: mascaramento e detecção de dados sensíveis.
export const LIMITE_MEMORIA_CURTA = 10;
export const DIAS_MEMORIA_MEDIA = 90;

const PADROES: Array<[RegExp, string]> = [
  [/\b(?:RG|documento|passaporte)\s*[: nº.]*\s*[A-Z0-9.-]+/gi, "[documento]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[e-mail]"],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]"],
  [/(\+?55\s?)?\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, "[telefone]"],
  [/\d{5,}/g, "[documento]"],
];

export function mascarar(texto: string): string {
  return PADROES.reduce((t, [re, sub]) => t.replace(re, sub), texto);
}

const SENSIVEIS =
  /\b(sa[uú]de|doen[çc]a|diagn[oó]stic\w*|laudo|cid\b|depress\w*|ansiedade|transtorno|rem[eé]dio|medica[çc][aã]o|tratamento|gr[aá]vid\w*|gesta[çc][aã]o|defici[eê]ncia|deficiente|autis\w*|tdah|cego|surd\w*|cadeirante|renda|sal[aá]rio|desempreg\w*|religi[aã]o|igreja|evang[eé]lic\w*|cat[oó]lic\w*|candombl[eé]|umbanda|orienta[çc][aã]o sexual|gay|l[eé]sbica|trans\b|ra[çc]a|etnia|pol[ií]tic\w* partid\w*|sindicato)\b/i;

export function contemDadoSensivel(texto: string): boolean {
  return SENSIVEIS.test(texto);
}

/** Remove linhas com dados sensíveis e mascara o restante; limita a 3 linhas. */
export function limparResumo(texto: string): string {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !contemDadoSensivel(l))
    .slice(0, 3)
    .map(mascarar)
    .join("\n");
}

export function ultimasMensagens<T>(msgs: T[]): T[] {
  return msgs.slice(-LIMITE_MEMORIA_CURTA);
}

export const TEMAS = ["calendário acadêmico", "trancamento", "aproveitamento de disciplinas", "auxílios e bolsas", "serviços de apoio", "orientação acadêmica"] as const;

/** Só categorias permitidas saem do texto bruto; nomes e dados sensíveis não são copiados. */
export function extrairTemas(textos: string[]): string[] {
  const texto = textos.join(" ").toLowerCase();
  const temas: string[] = [];
  if (/calend[aá]rio|prazo|semestre/.test(texto)) temas.push(TEMAS[0]);
  if (/trancamento|trancar/.test(texto)) temas.push(TEMAS[1]);
  if (/aproveitamento|ementa/.test(texto)) temas.push(TEMAS[2]);
  if (/aux[ií]lio|bolsa/.test(texto)) temas.push(TEMAS[3]);
  if (/apoio|encaminhamento|atendimento/.test(texto)) temas.push(TEMAS[4]);
  return temas.length ? temas : [TEMAS[5]];
}
