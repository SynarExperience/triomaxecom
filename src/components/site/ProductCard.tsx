"use client";

import { formatBRL, installment, pixPrice, type Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { CardIcon, CartIcon, PixIcon, WhatsAppIcon } from "./icons";
import styles from "./store.module.css";

const INSTALLMENTS = 12;

/* Mesmo número do rodapé, da sacola e do PDP. */
const WHATSAPP_NUMBER = "555132768583";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    /* O card não é um <a> inteiro: o botão do carrinho precisa ser um <button>
       de verdade, e botão dentro de <a> é HTML inválido. Os dois caminhos até a
       PDP — nome e "Comprar" — são links próprios. */
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

        {/* Divisão do card do voolt3d: "Comprar" é um link que leva à página do
            produto — quem clica ali quer ver o item —, e só o quadrado do
            carrinho adiciona, sem tirar a pessoa da vitrine. */}
        <div className={styles.cardActions}>
          <a className={styles.cardAction} href={`/produto/${product.slug}`}>
            Comprar
          </a>
          <button
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className={styles.cardActionIcon}
            onClick={() => addItem(product)}
            type="button"
          >
            <CartIcon />
          </button>
        </div>

        <a
          className={styles.cardWholesale}
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Olá! Gostaria de comprar ${product.name} por atacado.`,
          )}`}
          rel="noreferrer"
          target="_blank"
        >
          <WhatsAppIcon />
          Compre por atacado
        </a>
      </div>
    </article>
  );
}
