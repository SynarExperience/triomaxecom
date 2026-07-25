"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { TruckIcon } from "./icons";
import { formatBRL, type Product } from "@/data/catalog";
import { FRETE_GRATIS_A_PARTIR_DE } from "@/lib/checkout";
import styles from "./checkout.module.css";
import carrinho from "./carrinho.module.css";

/**
 * Página de carrinho. Espelha `/comprar/` da referência: itens à esquerda,
 * cartão de resumo à direita com uma vitrine de sugestões antes dos totais.
 *
 * Diferente do checkout, o carrinho mantém cabeçalho e rodapé da loja — quem
 * ainda está no carrinho pode querer voltar a navegar. Eles são montados pela
 * página (server), já que `SiteHeader` e `SiteFooter` são componentes async.
 */
export function CarrinhoPagina({ sugestoes }: { sugestoes: Product[] }) {
  const { addItem, lines, removeItem, setQuantity, subtotal } = useCart();

  const faltaParaFreteGratis = FRETE_GRATIS_A_PARTIR_DE - subtotal;

  /* Não sugerimos o que já está na sacola: ocupa espaço e não converte. */
  const naSacola = new Set(lines.map((linha) => linha.product.slug));
  const vitrine = sugestoes.filter((produto) => !naSacola.has(produto.slug)).slice(0, 6);

  return (
    <div className={styles.pagina}>
      <div className={styles.migalhas}>
        <h1 className={styles.titulo}>Carrinho</h1>
        <span>
          <Link href="/">Início</Link> › Carrinho de compras
        </span>
      </div>

      {lines.length === 0 ? (
        <div className={styles.conteudo}>
          <p className={styles.vazio}>
            Sua sacola está vazia. <Link href="/produtos">Ver filamentos »</Link>
          </p>
        </div>
      ) : (
        <div className={styles.conteudo}>
          <ul className={carrinho.itens}>
            {lines.map(({ product, quantity, total }) => (
              <li className={carrinho.item} key={product.slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className={carrinho.itemImagem} src={product.image} />

                <div className={carrinho.itemCorpo}>
                  <Link className={carrinho.itemNome} href={`/produto/${product.slug}`}>
                    {product.name}
                  </Link>

                  <div className={carrinho.itemControles}>
                    <div aria-label={`Quantidade de ${product.name}`} className={carrinho.qtd}>
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
                    <span className={carrinho.itemUnitario}>{formatBRL(product.price)}</span>
                  </div>
                </div>

                <strong className={carrinho.itemTotal}>{formatBRL(total)}</strong>

                <button
                  aria-label={`Remover ${product.name}`}
                  className={carrinho.remover}
                  onClick={() => removeItem(product.slug)}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <aside className={carrinho.resumo}>
            {vitrine.length > 0 ? (
              <>
                <h2 className={carrinho.vitrineTitulo}>Quem comprou levou também</h2>
                <div className={carrinho.vitrine}>
                  {vitrine.map((produto) => (
                    <article className={carrinho.sugestao} key={produto.slug}>
                      <Link href={`/produto/${produto.slug}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" src={produto.image} />
                        <span className={carrinho.sugestaoNome}>{produto.name}</span>
                      </Link>
                      <span className={carrinho.sugestaoPreco}>{formatBRL(produto.price)}</span>
                      <button onClick={() => addItem(produto)} type="button">
                        Comprar
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            <p className={carrinho.frete}>
              <TruckIcon />
              {faltaParaFreteGratis > 0
                ? `Faltam ${formatBRL(faltaParaFreteGratis)} para o frete grátis`
                : "Frete grátis liberado neste pedido"}
            </p>

            <div className={styles.resumoLinha}>
              <span>Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>

            <div className={styles.resumoTotal}>
              <span>Total</span>
              <strong>{formatBRL(subtotal)}</strong>
            </div>

            <Link className={carrinho.finalizar} href="/checkout">
              Finalizar compra
            </Link>
            <Link className={carrinho.continuar} href="/produtos">
              Ver mais produtos
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
