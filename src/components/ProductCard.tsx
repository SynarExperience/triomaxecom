import { formatBRL, installment, pixPrice, type Product } from "@/data/catalog";
import { BagIcon, CardIcon, PixIcon } from "./icons";
import styles from "./store.module.css";

const INSTALLMENTS = 12;

export function ProductCard({ product }: { product: Product }) {
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    <a className={styles.card} href={`/produto/${product.slug}`}>
      <div className={styles.cardMedia}>
        {product.badge ? <span className={styles.cardBadge}>{product.badge}</span> : null}
        {discount > 0 ? <span className={styles.cardDiscount}>{discount}% off</span> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} className="productPhoto" loading="lazy" src={product.image} />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{product.name}</h3>

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

        <span className={styles.cardAction}>
          <BagIcon />
          Comprar
        </span>
      </div>
    </a>
  );
}
