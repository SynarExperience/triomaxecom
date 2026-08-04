import type { CSSProperties } from "react";
import { listarAvisos } from "@/lib/conteudo";
import { BoxIcon, CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";
import styles from "./HeaderHero.module.css";

/*
 * A tabela `avisos` guarda só o texto — o painel não escolhe ícone. A barra
 * nasceu com um ícone por frase, então mantemos a mesma sequência e giramos por
 * posição: com os avisos semeados a barra sai idêntica à versão antiga, e um
 * aviso novo herda o próximo ícone da fila em vez de ficar sem nenhum.
 */
const icones = [CardIcon, PixIcon, TruckIcon, BoxIcon, ShieldIcon];

/*
 * Quantas vezes a lista se repete no trilho.
 *
 * O laço desloca o trilho por exatamente uma cópia e volta ao início. Para não
 * abrir vão, o que sobra à direita precisa cobrir a janela durante todo o
 * percurso — ou seja, `(cópias - 1) × largura da cópia >= largura da tela`.
 * Com as duas cópias fixas que havia antes isso quebrava: três avisos davam
 * 610 px por cópia contra 1455 px de tela, então a faixa esvaziava e reaparecia
 * do meio.
 *
 * A largura real só existe no navegador e este componente roda no servidor,
 * então estimamos por caractere. O erro é de propósito para baixo: subestimar
 * gera cópias sobrando, que ninguém vê; superestimar reabriria o vão.
 */
const LARGURA_ALVO = 5000; // cobre um monitor 4K (3840) com folga para o laço
const FIXO_POR_ITEM = 70; // ícone, respiro do item e separador "·"
const POR_CARACTERE = 6.5; // caixa alta em 12px, medido abaixo da média real

function copiasNecessarias(textos: string[]) {
  const larguraCopia = textos.reduce(
    (soma, texto) => soma + FIXO_POR_ITEM + texto.length * POR_CARACTERE,
    0,
  );

  // O teto evita um trilho absurdo se algum dia sobrar um aviso de uma letra.
  return Math.min(24, Math.max(2, Math.ceil(LARGURA_ALVO / Math.max(larguraCopia, 1))));
}

export async function AnnouncementMarquee({ avisos }: { avisos?: string[] }) {
  /* Aceita os textos por prop (útil quando a página já os carregou) e, sem
     eles, busca por conta própria — assim as páginas seguem só montando
     <AnnouncementMarquee />. */
  const textos = avisos ?? (await listarAvisos()).map((aviso) => aviso.texto);

  // Sem aviso ativo a faixa preta ficaria vazia na tela; melhor não existir.
  if (textos.length === 0) return null;

  const copias = copiasNecessarias(textos);

  return (
    <div aria-label="Avisos da loja" className={styles.marquee} role="marquee">
      {/* O CSS desloca o trilho por `-100% / copias`, ou seja, uma cópia exata.
          A contagem vai por variável porque só aqui se sabe quantas são. */}
      <div
        className={styles.marqueeTrack}
        style={{ "--marquee-copias": copias } as CSSProperties}
      >
        {Array.from({ length: copias }, (_, group) => (
          /* Só a primeira cópia é lida: as demais repetem o mesmo texto e no
             leitor de tela virariam eco. */
          <div aria-hidden={group > 0} className={styles.marqueeGroup} key={group}>
            {textos.map((texto, index) => {
              const Icon = icones[index % icones.length];
              return (
                <span className={styles.marqueeItem} key={`${index}-${texto}`}>
                  <Icon />
                  {texto}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
