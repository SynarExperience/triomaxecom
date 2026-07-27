import type { ReactNode } from "react";

/*
 * Descrição rica do produto. Cada item de `descricao` no banco é um bloco da
 * marcação mínima que o editor do painel produz:
 *
 *   "## Título"          subtítulo de seção
 *   "- item"             lista com marcadores (uma linha por item)
 *   "1. item"            lista numerada
 *   texto solto          parágrafo
 *
 * Inline: **negrito**, _itálico_ e [texto](https://link). Descrições antigas
 * (parágrafos sem marcação) caem no caso padrão e seguem idênticas.
 *
 * A marcação vira elementos React — nunca HTML cru — então texto vindo do
 * banco não tem como injetar tag ou script na página.
 */

const URL_SEGURA = /^(https?:\/\/|mailto:)/i;

/** Ordem dos grupos: 1 negrito, 2 itálico, 3/4 link. O itálico exige borda de
    palavra para "snake_case" não virar formatação. */
const INLINE = /\*\*([^*]+)\*\*|(?<![\w])_([^_\n]+)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(texto: string, base: string): ReactNode[] {
  const nos: ReactNode[] = [];
  let cursor = 0;
  let n = 0;
  INLINE.lastIndex = 0;
  for (let m = INLINE.exec(texto); m; m = INLINE.exec(texto)) {
    if (m.index > cursor) nos.push(texto.slice(cursor, m.index));
    const chave = `${base}-${n++}`;
    if (m[1] !== undefined) {
      nos.push(<strong key={chave}>{inline(m[1], chave)}</strong>);
    } else if (m[2] !== undefined) {
      nos.push(<em key={chave}>{inline(m[2], chave)}</em>);
    } else if (URL_SEGURA.test(m[4])) {
      nos.push(
        <a key={chave} href={m[4]} target="_blank" rel="noopener noreferrer">
          {m[3]}
        </a>,
      );
    } else {
      nos.push(m[3]);
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < texto.length) nos.push(texto.slice(cursor));
  return nos;
}

function Bloco({ texto, base }: { texto: string; base: string }) {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return null;

  if (linhas.every((l) => /^- /.test(l))) {
    return (
      <ul>
        {linhas.map((l, i) => (
          <li key={i}>{inline(l.slice(2), `${base}-${i}`)}</li>
        ))}
      </ul>
    );
  }

  if (linhas.every((l) => /^\d+[.)]\s/.test(l))) {
    return (
      <ol>
        {linhas.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\d+[.)]\s+/, ""), `${base}-${i}`)}</li>
        ))}
      </ol>
    );
  }

  if (linhas.length === 1 && linhas[0].startsWith("## ")) {
    return <h3>{inline(linhas[0].slice(3), base)}</h3>;
  }

  return (
    <>
      {linhas.map((l, i) => (
        <p key={i}>{inline(l, `${base}-${i}`)}</p>
      ))}
    </>
  );
}

export default function DescricaoRica({ blocos }: { blocos: string[] }) {
  return (
    <>
      {blocos.map((bloco, i) => (
        <Bloco key={i} texto={bloco} base={`b${i}`} />
      ))}
    </>
  );
}
