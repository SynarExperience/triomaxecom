"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "./CartProvider";
import { CartIcon, ChevronDownIcon, TruckIcon, WhatsAppIcon } from "./icons";
import pageStyles from "./pages.module.css";

/* Mesmo número do rodapé e da sacola — o atacado cai no mesmo atendimento. */
const WHATSAPP_NUMBER = "555132768583";

type ProductViewProps = {
  product: Product;
  /** Conteúdo estático da coluna direita renderizado pelo servidor. */
  infoTop: ReactNode;
  infoBottom: ReactNode;
};

/**
 * Galeria da PDP: foto grande + tira de miniaturas. Com uma foto só a tira não
 * é renderizada e o bloco fica idêntico ao que existia antes da galeria.
 */
function ProductGallery({ product }: { product: Product }) {
  const [ativa, setAtiva] = useState(0);
  const fotos = product.images;
  /* Índice fora da faixa (galeria encurtada entre renders) volta para a
     principal em vez de deixar a moldura vazia. */
  const foto = fotos[ativa] ?? fotos[0];

  /*
   * Arrastar a foto para o lado troca de slide no celular — mesmo gesto do hero.
   * Só conta como horizontal quando anda mais em X que em Y, senão rolar a
   * página verticalmente com o dedo trocaria a foto. O índice é grampeado nas
   * pontas (sem dar a volta), que é o que se espera de uma galeria.
   */
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start || fotos.length < 2) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;

    setAtiva((atual) => {
      const proximo = atual + (dx < 0 ? 1 : -1);
      return Math.min(fotos.length - 1, Math.max(0, proximo));
    });
  };

  return (
    <div className={pageStyles.pdpGallery}>
      <figure
        className={pageStyles.pdpMedia}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {product.badge ? <span className={pageStyles.pdpBadge}>{product.badge}</span> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={foto?.alt ?? product.name}
          className="productPhoto"
          draggable={false}
          /* Sem `lazy`: esta é a LCP da página. */
          src={foto?.url ?? product.image}
        />
      </figure>

      {fotos.length > 1 ? (
        <div aria-label="Fotos do produto" className={pageStyles.pdpThumbs} role="group">
          {fotos.map((f, indice) => (
            <button
              aria-label={`Ver foto ${indice + 1} de ${fotos.length}`}
              aria-pressed={indice === ativa}
              className={`${pageStyles.pdpThumb} ${indice === ativa ? pageStyles.pdpThumbActive : ""}`}
              key={f.url}
              onClick={() => setAtiva(indice)}
              type="button"
            >
              {/* alt vazio: o rótulo acessível já está no botão, repeti-lo aqui
                  faria o leitor de tela anunciar a mesma foto duas vezes. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="productPhoto" loading="lazy" src={f.url} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductView({ product, infoTop, infoBottom }: ProductViewProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className={pageStyles.pdpLayout}>
      <ProductGallery product={product} />

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
            <CartIcon />
            Adicionar ao carrinho
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
