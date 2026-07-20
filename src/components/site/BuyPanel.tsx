"use client";

import { useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { BagIcon, SearchIcon, WhatsAppIcon } from "./icons";
import pageStyles from "./pages.module.css";
import storeStyles from "./store.module.css";

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
          {/*
            Os dois botões disparam a mesma ação — é assim no voolt3d, onde o
            atalho de carrinho ao lado do "Comprar" repete a inclusão do item.
            O ícone fica escondido do leitor de tela justamente por ser
            repetição; quem navega por voz já tem o botão rotulado ao lado.
          */}
          <div className={pageStyles.buyActions}>
            <button
              className={pageStyles.buyButton}
              onClick={() => addItem(product, quantity)}
              type="button"
            >
              Comprar
            </button>
            <button
              aria-hidden="true"
              className={pageStyles.buyIconButton}
              onClick={() => addItem(product, quantity)}
              tabIndex={-1}
              type="button"
            >
              <BagIcon />
            </button>
          </div>
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
