"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, PixIcon, TruckIcon, WhatsAppIcon } from "./icons";
import { formatBRL } from "@/data/catalog";
import { supabase } from "@/lib/supabase";
import styles from "./cart.module.css";

const FREE_SHIPPING_FROM = 299;
const WHATSAPP_NUMBER = "555132768583";

/* Validação frouxa de propósito: só barra o que claramente não é e-mail. Regra
   apertada demais rejeita endereço válido e custa uma venda. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Contato = { nome: string; email: string; whatsapp: string };
type Erros = Partial<Record<keyof Contato, string>>;

const CONTATO_VAZIO: Contato = { nome: "", email: "", whatsapp: "" };

export function CartDrawer() {
  const { closeCart, isOpen, lines, pixTotal, removeItem, setQuantity, subtotal } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  /* A sacola ganha um passo antes do WhatsApp: sem o contato, um carrinho
     abandonado não deixa rastro nenhum para o time recuperar. */
  const [pedindoContato, setPedindoContato] = useState(false);
  const [contato, setContato] = useState<Contato>(CONTATO_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Fechar a gaveta desfaz o passo de contato: reabrir cai na sacola de novo.
    if (!isOpen) {
      setPedindoContato(false);
      setErros({});
      setEnviando(false);
    }
  }, [isOpen]);

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

  const digitos = (valor: string) => valor.replace(/\D/g, "");

  const validar = (): Erros => {
    const encontrados: Erros = {};
    if (contato.nome.trim().length < 3) encontrados.nome = "Informe seu nome completo.";
    if (!EMAIL_REGEX.test(contato.email.trim())) encontrados.email = "Informe um e-mail válido.";
    if (digitos(contato.whatsapp).length < 10) {
      encontrados.whatsapp = "Informe o WhatsApp com DDD.";
    }
    return encontrados;
  };

  const finalizar = async (event: React.FormEvent) => {
    event.preventDefault();

    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);

    /* Itens congelados: nome e preço do momento da compra, para o carrinho
       gravado não mudar se o catálogo mudar depois. */
    const itens = lines.map(({ product, quantity }) => ({
      nome: product.name,
      sku: product.slug,
      quantidade: quantity,
      precoUnitario: product.price,
    }));

    try {
      await supabase.from("carrinhos").insert({
        nome: contato.nome.trim(),
        email: contato.email.trim(),
        whatsapp: digitos(contato.whatsapp),
        itens,
        subtotal,
      });
    } catch {
      /* Falha ao registrar o carrinho não pode travar a venda: a conversa no
         WhatsApp vale mais que o registro. Segue para o atendimento assim
         mesmo — e o `insert` da anônima nem devolve o que gravou. */
    }

    /* `window.open` depois de um `await` pode ser barrado pelo bloqueador de
       pop-up, já que o clique original "expirou"; nesse caso navegamos a
       própria aba, que nunca é bloqueada. */
    const janela = window.open(whatsappHref, "_blank", "noopener");
    if (!janela) window.location.href = whatsappHref;

    setEnviando(false);
    closeCart();
  };

  const campo = (
    campoNome: keyof Contato,
    rotulo: string,
    extras: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <label className={styles.campo}>
      <span>{rotulo}</span>
      <input
        aria-invalid={erros[campoNome] ? true : undefined}
        onChange={(event) =>
          setContato((atual) => ({ ...atual, [campoNome]: event.target.value }))
        }
        required
        value={contato[campoNome]}
        {...extras}
      />
      {erros[campoNome] ? (
        <p className={styles.erro} role="alert">
          {erros[campoNome]}
        </p>
      ) : null}
    </label>
  );

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

              {pedindoContato ? (
                <form className={styles.contato} noValidate onSubmit={finalizar}>
                  <p className={styles.contatoIntro}>
                    Só faltam seus dados para a gente confirmar o pedido no WhatsApp.
                  </p>
                  {campo("nome", "Nome completo", {
                    autoComplete: "name",
                    autoFocus: true,
                    placeholder: "Seu nome e sobrenome",
                    type: "text",
                  })}
                  {campo("email", "E-mail", {
                    autoComplete: "email",
                    inputMode: "email",
                    placeholder: "voce@email.com",
                    type: "email",
                  })}
                  {campo("whatsapp", "WhatsApp", {
                    autoComplete: "tel",
                    inputMode: "tel",
                    placeholder: "(51) 99999-9999",
                    type: "tel",
                  })}
                  <button className={styles.checkout} disabled={enviando} type="submit">
                    <WhatsAppIcon />
                    {enviando ? "Abrindo WhatsApp…" : "Finalizar no WhatsApp"}
                  </button>
                  <button
                    className={styles.keepShopping}
                    onClick={() => setPedindoContato(false)}
                    type="button"
                  >
                    Voltar para a sacola
                  </button>
                </form>
              ) : (
                <>
                  <button
                    className={styles.checkout}
                    onClick={() => setPedindoContato(true)}
                    type="button"
                  >
                    <WhatsAppIcon />
                    Finalizar no WhatsApp
                  </button>
                  <button className={styles.keepShopping} onClick={closeCart} type="button">
                    Continuar comprando
                  </button>
                </>
              )}
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
