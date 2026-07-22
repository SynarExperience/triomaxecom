"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { CheckIcon, CloseIcon } from "./icons";
import { formatBRL } from "@/data/catalog";
import styles from "./toast.module.css";

/** Some sozinha depois disso. Tempo suficiente para ler e decidir, curto o
    bastante para não ficar pairando sobre o catálogo. */
const DURACAO = 6000;

/**
 * Aviso flutuante de "adicionado ao carrinho". Substitui a abertura automática
 * da gaveta: informa sem interromper quem está montando um pedido com várias
 * cores — mesmo comportamento da loja de referência.
 */
export function CartToast() {
  const { count, subtotal, ultimaAdicao } = useCart();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!ultimaAdicao) return;
    setVisivel(true);
    const relogio = window.setTimeout(() => setVisivel(false), DURACAO);
    /* A limpeza reinicia a contagem quando outro item entra antes do fim — sem
       isso o segundo aviso herdaria o tempo restante do primeiro. */
    return () => window.clearTimeout(relogio);
  }, [ultimaAdicao]);

  if (!ultimaAdicao || !visivel) return null;

  const { product } = ultimaAdicao;

  return (
    <div aria-live="polite" className={styles.toast} role="status">
      <div className={styles.cabecalho}>
        <span className={styles.selo}>
          <CheckIcon />
        </span>
        Adicionado ao carrinho
        <button
          aria-label="Fechar aviso"
          className={styles.fechar}
          onClick={() => setVisivel(false)}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.item}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className={styles.imagem} src={product.image} />
        <div className={styles.corpo}>
          <span className={styles.nome}>{product.name}</span>
          <span className={styles.preco}>{formatBRL(product.price)}</span>
        </div>
      </div>

      <div className={styles.resumo}>
        <span>
          {count} {count === 1 ? "item" : "itens"} no carrinho
        </span>
        <strong>{formatBRL(subtotal)}</strong>
      </div>

      <Link className={styles.acao} href="/carrinho">
        Ver carrinho
      </Link>
    </div>
  );
}
