"use client";

import { formatBRL, installment, pixPrice, type Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { BagIcon, CardIcon, PixIcon } from "./icons";
import styles from "./store.module.css";

const INSTALLMENTS = 12;

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    /* O card inteiro leva à PDP por um link "esticado" sobre o nome do produto,
       o que deixa o botão "Comprar" ser um <button> de verdade — botão dentro de
       <a> é HTML inválido e roubaria o clique de adicionar à sacola. */
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {product.badge ? <span className={styles.cardBadge}>{product.badge}</span> : null}
        {discount > 0 ? <span className={styles.cardDiscount}>{discount}% off</span> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} className="productPhoto" loading="lazy" src={product.image} />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>
          <a className={styles.cardNameLink} href={`/produto/${product.slug}`}>
            {product.name}
          </a>
        </h3>

        {/* Valor e sufixo em elementos separados: num card estreito "com Pix"
            desce sozinho como rótulo, em vez de partir o número no meio. */}
        <span className={styles.cardPix}>
          <PixIcon />
          <span className={styles.cardPixText}>
            <strong>{formatBRL(pixPrice(product.price))}</strong>
            <span className={styles.cardPixLabel}>com Pix</span>
          </span>
        </span>

        <span className={styles.cardPriceRow}>
          {product.compareAt ? (
            <s className={styles.cardCompare}>{formatBRL(product.compareAt)}</s>
          ) : null}
          <span className={styles.cardPrice}>{formatBRL(product.price)}</span>
        </span>

        <span className={styles.cardInstallments}>
          <CardIcon />
          {INSTALLMENTS} x de {formatBRL(installment(product.price, INSTALLMENTS))}
        </span>

        <button
          aria-label={`Adicionar ${product.name} à sacola`}
          className={styles.cardAction}
          onClick={() => addItem(product)}
          type="button"
        >
          <BagIcon />
          Comprar
        </button>
      </div>
    </article>
  );
}
