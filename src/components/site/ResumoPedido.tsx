"use client";

import { useState } from "react";
import { ChevronDownIcon, TagIcon } from "./icons";
import { useCart } from "./CartProvider";
import { formatBRL } from "@/data/catalog";

import type { OpcaoFrete } from "@/types/checkout";
import styles from "./checkout.module.css";

/**
 * Resumo do pedido. No desktop é um cartão fixo na coluna direita; abaixo de
 * 900px vira a barra escura colapsável do topo, como no checkout de referência.
 */
export function ResumoPedido({ frete }: { frete?: OpcaoFrete | null }) {
  const { lines, subtotal } = useCart();
  const [aberto, setAberto] = useState(false);
  const [pedindoCupom, setPedindoCupom] = useState(false);

  const total = subtotal + (frete?.preco ?? 0);

  return (
    <div className={styles.colunaResumo}>
      <div className={[styles.resumoBarra, aberto ? styles.resumoBarraAberta : ""].join(" ")}>
        <button
          aria-expanded={aberto}
          className={styles.resumoBarraBotao}
          onClick={() => setAberto((atual) => !atual)}
          type="button"
        >
          <ChevronDownIcon />
          Ver detalhes do pedido
          <span className={styles.resumoBarraTotal}>{formatBRL(total)}</span>
        </button>
      </div>

      {/* No celular o cartão só aparece com a barra aberta; no desktop a classe
          `resumoOculto` não tem efeito e ele fica sempre visível. */}
      <aside
        aria-label="Resumo do pedido"
        className={[styles.resumo, aberto ? "" : styles.resumoOculto].join(" ")}
      >
        {lines.map(({ product, quantity, total: totalLinha }) => (
          <div className={styles.resumoItem} key={product.slug}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className={styles.resumoImagem} src={product.image} />
            <div className={styles.resumoNome}>
              {product.name}
              <span className={styles.resumoQuantidade}> × {quantity}</span>
            </div>
            <div className={styles.resumoPrecos}>
              {product.compareAt ? (
                <span className={styles.resumoDe}>{formatBRL(product.compareAt * quantity)}</span>
              ) : null}
              <span className={styles.resumoPor}>{formatBRL(totalLinha)}</span>
            </div>
          </div>
        ))}

        <div className={styles.resumoLinha}>
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        {frete ? (
          <div className={styles.resumoLinha}>
            <span>Custo de frete</span>
            <span className={frete.preco === 0 ? styles.freteGratis : undefined}>
              {frete.preco === 0 ? "Grátis" : formatBRL(frete.preco)}
            </span>
          </div>
        ) : null}

        <div className={styles.resumoTotal}>
          <span>Total</span>
          <strong>{formatBRL(total)}</strong>
        </div>

        {pedindoCupom ? (
          <form
            className={styles.cupomForm}
            onSubmit={(evento) => {
              evento.preventDefault();
              /* Sem motor de promoções nesta demonstração: o campo existe para o
                 fluxo ficar completo, mas nenhum código é aceito. */
              setPedindoCupom(false);
            }}
          >
            <input aria-label="Código do cupom" name="cupom" placeholder="SEUCUPOM" />
            <button type="submit">Aplicar</button>
          </form>
        ) : (
          <button className={styles.cupom} onClick={() => setPedindoCupom(true)} type="button">
            <TagIcon />
            Adicionar cupom de desconto
          </button>
        )}
      </aside>
    </div>
  );
}
