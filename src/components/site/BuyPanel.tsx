"use client";

import { useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { BagIcon, ChevronDownIcon, TruckIcon, WhatsAppIcon } from "./icons";
import pageStyles from "./pages.module.css";

/* Mesmo número do rodapé e da sacola — o atacado cai no mesmo atendimento. */
const WHATSAPP_NUMBER = "555132768583";

type ProductViewProps = {
  product: Product;
  /** Conteúdo estático da coluna direita renderizado pelo servidor. */
  infoTop: ReactNode;
  infoBottom: ReactNode;
};

export function ProductView({ product, infoTop, infoBottom }: ProductViewProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className={pageStyles.pdpLayout}>
      <figure className={pageStyles.pdpMedia} style={{ margin: 0 }}>
        {product.badge ? <span className={pageStyles.pdpBadge}>{product.badge}</span> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} className="productPhoto" src={product.image} />
      </figure>

      <div>
        {infoTop}

        {/* Stepper e botão dividem a linha, como na referência: quantidade à
            esquerda, ação de compra ocupando o resto. */}
        <div className={pageStyles.buyRow}>
          <div aria-label="Quantidade" className={pageStyles.qty}>
            <button
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              type="button"
            >
              −
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((q) => Math.min(9, q + 1))}
              type="button"
            >
              +
            </button>
          </div>
          <button
            className={pageStyles.buyButton}
            onClick={() => addItem(product, quantity)}
            type="button"
          >
            <BagIcon />
            Adicionar à sacola
          </button>
        </div>

        <a
          className={pageStyles.wholesaleButton}
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Olá! Gostaria de comprar ${product.name} por atacado.`,
          )}`}
          rel="noreferrer"
          target="_blank"
        >
          <WhatsAppIcon />
          Compre por atacado
        </a>

        {/* "Meios de envio" retrátil, como na referência — aberto por padrão. */}
        <details className={pageStyles.shippingBox} open>
          <summary className={pageStyles.shippingSummary}>
            <TruckIcon />
            Meios de envio
            <ChevronDownIcon />
          </summary>
          <form
            aria-label="Calcular frete"
            className={pageStyles.shippingBody}
            onSubmit={(event) => event.preventDefault()}
          >
            <label
              htmlFor="cep"
              style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
            >
              CEP
            </label>
            <div className={pageStyles.shippingRow}>
              <input
                autoComplete="postal-code"
                id="cep"
                inputMode="numeric"
                name="cep"
                placeholder="Seu CEP"
              />
              <button className={pageStyles.shippingCalc} type="submit">
                Calcular
              </button>
            </div>
            <a
              className={pageStyles.shippingHelp}
              href="https://buscacepinter.correios.com.br/app/endereco/index.php"
              rel="noreferrer"
              target="_blank"
            >
              Não sei meu CEP
            </a>
          </form>
        </details>

        {infoBottom}
      </div>
    </div>
  );
}
