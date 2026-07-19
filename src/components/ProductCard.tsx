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

        <span className={styles.cardPix}>
          <PixIcon />
          {formatBRL(pixPrice(product.price))} com Pix
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
