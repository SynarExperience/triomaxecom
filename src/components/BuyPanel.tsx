"use client";

import { useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { BagIcon, SearchIcon } from "./icons";
import pageStyles from "./pages.module.css";
import storeStyles from "./store.module.css";

type ProductViewProps = {
  product: Product;
  /** Conteúdo estático da coluna direita renderizado pelo servidor. */
  infoTop: ReactNode;
  infoBottom: ReactNode;
};

export function ProductView({ product, infoTop, infoBottom }: ProductViewProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={pageStyles.pdpLayout}>
      <figure className={pageStyles.pdpMedia} style={{ margin: 0 }}>
        {product.badge ? <span className={pageStyles.pdpBadge}>{product.badge}</span> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.name} className="productPhoto" src={product.image} />
      </figure>

      <div>
        {infoTop}

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
            onClick={() => undefined}
            type="button"
          >
            <BagIcon />
            Adicionar à sacola
          </button>
        </div>

        <form
          aria-label="Calcular frete"
          className={pageStyles.shippingBox}
          onSubmit={(event) => event.preventDefault()}
        >
          <label
            htmlFor="cep"
            style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
          >
            CEP
          </label>
          <input
            autoComplete="postal-code"
            id="cep"
            inputMode="numeric"
            name="cep"
            placeholder="Calcular frete — digite seu CEP"
          />
          <button className={storeStyles.buttonGhost} type="submit">
            <SearchIcon />
            Calcular
          </button>
        </form>

        {infoBottom}
      </div>
    </div>
  );
}
