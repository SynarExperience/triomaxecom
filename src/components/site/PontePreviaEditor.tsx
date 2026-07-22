"use client";

/*
 * Ponte entre o editor de layout do painel e a loja exibida na prévia dele.
 *
 * O painel roda em outro domínio, então o navegador não deixa ele tocar o DOM
 * daqui — passar o mouse numa linha da coluna não teria como contornar a seção
 * correspondente. A saída é o painel pedir por `postMessage` e a vitrine, que é
 * dona do próprio DOM, aplicar o destaque.
 *
 * Fora do iframe nada disso roda: para o visitante comum o componente é um
 * `useEffect` que retorna na primeira linha.
 */

import { useEffect } from "react";

/** Blocos que a home sabe destacar — os mesmos `data-bloco` das seções. */
const BLOCOS = new Set(["slider", "categories"]);

const CLASSE = "ponte-previa-destaque";

/*
 * A regra é `[data-bloco].classe` (dois seletores) de propósito: as seções da
 * home já trazem uma classe de CSS module com fundo próprio, e com a mesma
 * especificidade quem ganharia dependeria da ordem em que o Next injeta os
 * estilos. `box-shadow` interno em vez de `background` porque ele tinge por
 * cima do fundo original sem apagá-lo.
 */
const CSS = `[data-bloco].${CLASSE}{
  outline: 2px solid #2563eb;
  outline-offset: -2px;
  box-shadow: inset 0 0 0 9999px rgba(37, 99, 235, 0.08);
}`;

/*
 * Sem `NEXT_PUBLIC_EDITOR_ORIGINS` a lista fica vazia e nenhuma mensagem é
 * aceita. O padrão precisa ser fechado: qualquer site pode embutir a loja num
 * iframe, e uma ponte que aceitasse `*` deixaria essa página obedecer a
 * comandos de quem a embutiu.
 */
const ORIGENS_PERMITIDAS = (process.env.NEXT_PUBLIC_EDITOR_ORIGINS ?? "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

type MensagemDestacar = { tipo: "destacar"; bloco: unknown };

function ehMensagemDestacar(dados: unknown): dados is MensagemDestacar {
  return (
    typeof dados === "object" &&
    dados !== null &&
    (dados as Record<string, unknown>).tipo === "destacar"
  );
}

export function PontePreviaEditor() {
  useEffect(() => {
    if (window.self === window.top) return;
    if (ORIGENS_PERMITIDAS.length === 0) return;

    const estilo = document.createElement("style");
    estilo.textContent = CSS;
    document.head.append(estilo);

    let destacado: Element | null = null;
    const limpar = () => {
      destacado?.classList.remove(CLASSE);
      destacado = null;
    };

    const aoReceber = (evento: MessageEvent) => {
      // Origem primeiro: o conteúdo da mensagem só interessa se veio do painel.
      if (!ORIGENS_PERMITIDAS.includes(evento.origin)) return;
      if (!ehMensagemDestacar(evento.data)) return;

      // Limpa antes de qualquer coisa: bloco desconhecido some com o destaque
      // em vez de deixar o anterior preso na tela.
      limpar();
      const { bloco } = evento.data;
      if (typeof bloco !== "string" || !BLOCOS.has(bloco)) return;

      const alvo = document.querySelector(`[data-bloco="${bloco}"]`);
      if (!alvo) return;
      alvo.classList.add(CLASSE);
      destacado = alvo;
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    window.addEventListener("message", aoReceber);
    return () => {
      window.removeEventListener("message", aoReceber);
      limpar();
      estilo.remove();
    };
  }, []);

  return null;
}
