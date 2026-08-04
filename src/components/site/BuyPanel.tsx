"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  formatBRL,
  isSoldOut,
  isVariantSoldOut,
  variantPrice,
  type Product,
  type ProductVariant,
} from "@/data/catalog";
import { useCart } from "./CartProvider";
import { CardIcon, CartIcon, ChevronDownIcon, TruckIcon, WhatsAppIcon } from "./icons";
import { cepValido, cotarFrete, mascaraCep, previsaoEntrega } from "@/lib/checkout";
import type { OpcaoFrete } from "@/types/checkout";
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
        {isSoldOut(product) ? (
          <span className={pageStyles.pdpSoldOutBadge}>Esgotado</span>
        ) : product.badge ? (
          <span className={pageStyles.pdpBadge}>{product.badge}</span>
        ) : null}
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
  const esgotado = isSoldOut(product);

  /* Com variações, a compra é da variação: começa na primeira disponível e o
     preço exibido acompanha a escolha. Sem variações, nada disso existe e o
     fluxo é o de sempre. */
  const [variacao, setVariacao] = useState<ProductVariant | null>(
    () => product.variants.find((v) => !isVariantSoldOut(v)) ?? product.variants[0] ?? null,
  );

  const precoAtual = variacao ? variantPrice(product, variacao) : product.price;
  /* O valor cheio riscado é do produto; numa variação com preço próprio ele
     deixa de fazer sentido (o desconto foi calculado sobre o preço base). */
  const compareAtual = variacao && variacao.price !== null ? undefined : product.compareAt;
  const descontoAtual = compareAtual ? Math.round((1 - precoAtual / compareAtual) * 100) : 0;
  const variacaoEsgotada = variacao ? isVariantSoldOut(variacao) : false;

  /* Cotação de frete na PDP: reusa a mesma rota do checkout, com este produto
     na quantidade escolhida. */
  const [cep, setCep] = useState("");
  const [cotando, setCotando] = useState(false);
  const [fretes, setFretes] = useState<OpcaoFrete[] | null>(null);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  const calcularFrete = async () => {
    if (!cepValido(cep)) {
      setErroFrete("Digite um CEP válido.");
      setFretes(null);
      return;
    }
    setCotando(true);
    setErroFrete(null);
    try {
      const opcoes = await cotarFrete(cep, [{ slug: product.slug, quantidade: quantity }]);
      setFretes(opcoes);
      if (opcoes.length === 0) setErroFrete("Nenhuma transportadora atende esse CEP.");
    } catch {
      setErroFrete("Não foi possível calcular o frete. Tente novamente.");
      setFretes(null);
    } finally {
      setCotando(false);
    }
  };

  return (
    <div className={pageStyles.pdpLayout}>
      <ProductGallery product={product} />

      <div>
        {infoTop}

        {/* O preço mora aqui (e não no bloco estático do servidor) porque ele
            reage à variação escolhida. Sem variações, mostra o do produto —
            visualmente idêntico ao que era. */}
        <div className={pageStyles.priceBox}>
          {compareAtual ? (
            <s className={pageStyles.priceCompare}>{formatBRL(compareAtual)}</s>
          ) : null}
          <div className={pageStyles.priceMain}>
            <strong>{formatBRL(precoAtual)}</strong>
            {descontoAtual > 0 ? (
              <span className={pageStyles.priceOff}>{descontoAtual}% OFF</span>
            ) : null}
          </div>
          {/* Detalhes de pagamento recolhidos, como o "Ver mais detalhes" da
              referência — nativo em <details>, abre sem JS. */}
          <details className={pageStyles.priceDetails}>
            <summary>
              <CardIcon />
              Ver mais detalhes
            </summary>
            {/* Só a condição, sem o valor da parcela — mesma leitura do card na
                vitrine. O número exato de cada parcela quem dá é o checkout,
                com as parcelas reais do Mercado Pago. */}
            <p className={pageStyles.priceInstallments}>12x no cartão</p>
          </details>
        </div>

        {product.variants.length > 0 && !esgotado ? (
          <div aria-label="Escolha a opção" className={pageStyles.variantRow} role="group">
            {product.variants.map((v) => {
              const semEstoque = isVariantSoldOut(v);
              const ativa = variacao?.id === v.id;
              return (
                <button
                  aria-pressed={ativa}
                  className={[
                    pageStyles.variantPill,
                    ativa ? pageStyles.variantPillActive : "",
                    semEstoque ? pageStyles.variantPillSoldOut : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={v.id}
                  onClick={() => setVariacao(v)}
                  type="button"
                >
                  {v.name}
                  {semEstoque ? <span> · esgotado</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Stepper e botão dividem a linha, como na referência: quantidade à
            esquerda, ação de compra ocupando o resto. Esgotado some com os
            dois: escolher quantidade de algo que não dá para comprar é convite
            para frustração. O atacado logo abaixo continua, porque é onde a
            pessoa pergunta quando volta. */}
        {esgotado ? (
          <p className={pageStyles.soldOutNotice}>
            Esgotado
            <span>Sem unidades disponíveis no momento.</span>
          </p>
        ) : (
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
              disabled={variacaoEsgotada}
              onClick={() => addItem(product, quantity, variacao ?? undefined)}
              type="button"
            >
              <CartIcon />
              {variacaoEsgotada ? "Opção esgotada" : "Adicionar ao carrinho"}
            </button>
          </div>
        )}

        <a
          className={pageStyles.wholesaleButton}
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Olá! Gostaria de comprar ${product.name} por atacado.`,
          )}`}
          rel="noreferrer"
          target="_blank"
        >
          <WhatsAppIcon />
          Compre pelo WhatsApp
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
            onSubmit={(event) => {
              event.preventDefault();
              calcularFrete();
            }}
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
                value={cep}
                onChange={(event) => {
                  setCep(mascaraCep(event.target.value));
                  setErroFrete(null);
                }}
              />
              <button className={pageStyles.shippingCalc} type="submit" disabled={cotando}>
                {cotando ? "Calculando…" : "Calcular"}
              </button>
            </div>

            {erroFrete ? <p className={pageStyles.shippingError}>{erroFrete}</p> : null}

            {fretes && fretes.length > 0 ? (
              <ul className={pageStyles.shippingOptions}>
                {fretes.map((opcao) => (
                  <li key={opcao.id} className={pageStyles.shippingOption}>
                    <div>
                      <span className={pageStyles.shippingOptionName}>
                        {opcao.transportadora} {opcao.servico}
                      </span>
                      <span className={pageStyles.shippingOptionEta}>
                        {opcao.retirada
                          ? "Pronto para retirada em até 24h úteis"
                          : `Chega ${previsaoEntrega(opcao.prazoDias)}`}
                      </span>
                    </div>
                    <span
                      className={
                        opcao.preco === 0
                          ? `${pageStyles.shippingOptionPrice} ${pageStyles.shippingOptionFree}`
                          : pageStyles.shippingOptionPrice
                      }
                    >
                      {opcao.preco === 0 ? "Grátis" : formatBRL(opcao.preco)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

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
