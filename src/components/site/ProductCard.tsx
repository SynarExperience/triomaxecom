"use client";

import { formatBRL, isSoldOut, type Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { CardIcon, CartIcon, WhatsAppIcon } from "./icons";
import styles from "./store.module.css";

const INSTALLMENTS = 12;

/* Mesmo número do rodapé, da sacola e do PDP. */
const WHATSAPP_NUMBER = "555132768583";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;
  const esgotado = isSoldOut(product);

  return (
    /* O card não é um <a> inteiro: o botão do carrinho precisa ser um <button>
       de verdade, e botão dentro de <a> é HTML inválido. Os dois caminhos até a
       PDP — nome e "Comprar" — são links próprios. */
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {/* Esgotado toma o lugar do selo: os dois ficam no mesmo canto, e saber
            que acabou importa mais do que saber que é lançamento. */}
        {esgotado ? (
          <span className={styles.cardSoldOutBadge}>Esgotado</span>
        ) : product.badge ? (
          <span className={styles.cardBadge}>{product.badge}</span>
        ) : null}
        {discount > 0 && !esgotado ? (
          <span className={styles.cardDiscount}>{discount}% off</span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} className="productPhoto" loading="lazy" src={product.image} />
        {/* Passar o mouse revela a segunda foto por cima da principal — só quando
            o produto tem galeria. `aria-hidden` porque é a mesma peça: repetir
            no leitor de tela não agrega. */}
        {product.images.length > 1 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt=""
            aria-hidden
            className={`productPhoto ${styles.cardMediaHover}`}
            loading="lazy"
            src={product.images[1].url}
          />
        ) : null}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>
          <a className={styles.cardNameLink} href={`/produto/${product.slug}`}>
            {product.name}
          </a>
        </h3>

        {/* Preço em destaque; o valor cheio anterior fica riscado ao lado quando
            há promoção. */}
        <span className={styles.cardPriceRow}>
          {product.compareAt ? (
            <s className={styles.cardCompare}>{formatBRL(product.compareAt)}</s>
          ) : null}
          <strong className={styles.cardPrice}>{formatBRL(product.price)}</strong>
        </span>

        {/* Só a condição, sem o valor da parcela: na vitrine o que informa é
            poder parcelar, e o número quebrado ("12 x de R$ 7,49") competia com
            o preço logo acima. A parcela com valor continua no PDP, onde a
            pessoa já está decidindo. */}
        <span className={styles.cardInstallments}>
          <CardIcon />
          em {INSTALLMENTS}x no cartão
        </span>

        {/* Divisão do card do voolt3d: "Comprar" é um link que leva à página do
            produto — quem clica ali quer ver o item —, e só o quadrado do
            carrinho adiciona, sem tirar a pessoa da vitrine. */}
        <div className={styles.cardActions}>
          {esgotado ? (
            /* Sem "Comprar" e sem o quadrado do carrinho: oferecer a ação e
               depois recusar a compra é pior do que não oferecer. A tarja é um
               <span>, não um botão desabilitado, porque não há o que clicar. */
            <span className={styles.cardSoldOut}>Esgotado</span>
          ) : (
            <>
              <a className={styles.cardAction} href={`/produto/${product.slug}`}>
                Comprar
              </a>
              {product.variants.length > 0 ? (
                /* Com variações não há o que "adicionar direto": a escolha é na
                   página do produto, então o quadrado vira o mesmo link. */
                <a
                  aria-label={`Escolher opções de ${product.name}`}
                  className={styles.cardActionIcon}
                  href={`/produto/${product.slug}`}
                >
                  <CartIcon />
                </a>
              ) : (
                <button
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  className={styles.cardActionIcon}
                  onClick={() => addItem(product)}
                  type="button"
                >
                  <CartIcon />
                </button>
              )}
            </>
          )}
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
          Compre pelo WhatsApp
        </a>
      </div>
    </article>
  );
}
