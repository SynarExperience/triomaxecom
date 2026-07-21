import { PixIcon } from "./icons";
import styles from "./store.module.css";

/*
 * Bandeiras aceitas. As marcas de cartão usam os SVGs oficiais (conjunto MIT
 * svg-credit-card-payment-icons); Pix usa o ícone oficial do Banco Central
 * (Simple Icons, CC0) e o boleto um código de barras genérico. Exibir as formas
 * de pagamento aceitas é uso nominativo padrão de e-commerce.
 */
const brands = [
  { slug: "visa", nome: "Visa" },
  { slug: "mastercard", nome: "Mastercard" },
  { slug: "elo", nome: "Elo" },
  { slug: "amex", nome: "American Express" },
  { slug: "hipercard", nome: "Hipercard" },
  { slug: "diners", nome: "Diners Club" },
  { slug: "discover", nome: "Discover" },
];

export function PaymentBrands() {
  return (
    <div className={styles.payFlags}>
      {brands.map((b) => (
        <span className={styles.payFlag} key={b.slug} title={b.nome}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={b.nome} height={32} src={`/payment/${b.slug}.svg`} width={50} />
        </span>
      ))}

      <span className={styles.payFlag} title="Pix">
        <PixIcon className={styles.payFlagPix} />
      </span>

      <span className={styles.payFlag} title="Boleto bancário">
        <svg aria-hidden="true" height="18" viewBox="0 0 32 18" width="28">
          <g fill="#1a1a1a">
            <rect height="18" width="2" x="2" />
            <rect height="18" width="1" x="6" />
            <rect height="18" width="3" x="9" />
            <rect height="18" width="1" x="14" />
            <rect height="18" width="2" x="17" />
            <rect height="18" width="1" x="21" />
            <rect height="18" width="3" x="24" />
            <rect height="18" width="1" x="29" />
          </g>
        </svg>
      </span>
    </div>
  );
}
