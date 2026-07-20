"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, PixIcon, TruckIcon, WhatsAppIcon } from "./icons";
import { formatBRL } from "@/data/catalog";
import styles from "./cart.module.css";

const FREE_SHIPPING_FROM = 299;
const WHATSAPP_NUMBER = "555132768583";

export function CartDrawer() {
  const { closeCart, isOpen, lines, pixTotal, removeItem, setQuantity, subtotal } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeCart, isOpen]);

  if (!isOpen) return null;

  const missingForFreeShipping = FREE_SHIPPING_FROM - subtotal;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    ["Olá! Quero fechar este pedido:", ...lines.map(
      (line) => `• ${line.quantity}x ${line.product.name} — ${formatBRL(line.total)}`,
    ), `Total: ${formatBRL(subtotal)}`].join("\n"),
  )}`;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) closeCart();
      }}
    >
      <aside
        aria-label="Sacola de compras"
        aria-modal="true"
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            <BagIcon />
            Sua sacola
          </h2>
          <button aria-label="Fechar sacola" className={styles.close} onClick={closeCart} type="button">
            <CloseIcon />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <BagIcon />
            <p>Sua sacola está vazia.</p>
            <a className={styles.emptyLink} href="/produtos" onClick={closeCart}>
              Ver filamentos
            </a>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {lines.map(({ product, quantity, total }) => (
                <li className={styles.line} key={product.slug}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className={styles.lineImage} src={product.image} />

                  <div className={styles.lineBody}>
                    <a className={styles.lineName} href={`/produto/${product.slug}`} onClick={closeCart}>
                      {product.name}
                    </a>
                    <span className={styles.lineUnit}>{formatBRL(product.price)} cada</span>

                    <div className={styles.lineControls}>
                      <div aria-label={`Quantidade de ${product.name}`} className={styles.qty}>
                        <button
                          aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(product.slug, quantity - 1)}
                          type="button"
                        >
                          −
                        </button>
                        <span aria-live="polite">{quantity}</span>
                        <button
                          aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(product.slug, quantity + 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className={styles.remove}
                        onClick={() => removeItem(product.slug)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <span className={styles.lineTotal}>{formatBRL(total)}</span>
                </li>
              ))}
            </ul>

            <footer className={styles.footer}>
              <p className={styles.shipping}>
                <TruckIcon />
                {missingForFreeShipping > 0
                  ? `Faltam ${formatBRL(missingForFreeShipping)} para o frete grátis`
                  : "Frete grátis liberado neste pedido"}
              </p>

              <div className={styles.totals}>
                <span>Subtotal</span>
                <strong>{formatBRL(subtotal)}</strong>
              </div>
              <p className={styles.pix}>
                <PixIcon />
                {formatBRL(pixTotal)} à vista no Pix
              </p>

              <a className={styles.checkout} href={whatsappHref} rel="noreferrer" target="_blank">
                <WhatsAppIcon />
                Finalizar no WhatsApp
              </a>
              <button className={styles.keepShopping} onClick={closeCart} type="button">
                Continuar comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
