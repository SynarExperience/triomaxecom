import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/site/BuyPanel";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  CardIcon,
  CheckIcon,
  ChevronDownIcon,
  PixIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from "@/components/site/icons";
import pageStyles from "@/components/site/pages.module.css";
import storeStyles from "@/components/site/store.module.css";
import {
  formatBRL,
  getProduct,
  installment,
  pixPrice,
  products,
  relatedProducts,
} from "@/data/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Produto não encontrado | Triomax" };
  return {
    title: `${product.name} | Triomax`,
    description: product.short,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = relatedProducts(slug);

  const infoTop = (
    <>
      <p className={pageStyles.pdpCategory}>{product.line}</p>
      <h1 className={pageStyles.pdpTitle}>{product.name}</h1>
      <div className={pageStyles.pdpRating} aria-label="Avaliação 4,9 de 5">
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <span>4,9 · 132 avaliações</span>
      </div>
      <p className={pageStyles.pdpShort}>{product.short}</p>

      <div className={pageStyles.priceBox}>
        <p className={pageStyles.pricePix}>
          <PixIcon />
          {formatBRL(pixPrice(product.price))} com Pix
        </p>
        <div className={pageStyles.priceMain}>
          {product.compareAt ? <s>{formatBRL(product.compareAt)}</s> : null}
          <strong>{formatBRL(product.price)}</strong>
        </div>
        <p className={pageStyles.priceInstallments}>
          <CardIcon />
          12 x de {formatBRL(installment(product.price))} sem juros
        </p>
      </div>
    </>
  );

  const infoBottom = (
    <>
      <ul className={pageStyles.trustList}>
        <li>
          <TruckIcon />
          Frete grátis acima de R$ 299 · envio em até 24h úteis
        </li>
        <li>
          <ShieldIcon />
          Compra 100% protegida com garantia de fábrica
        </li>
        <li>
          <CheckIcon />
          Troca fácil em até 7 dias após o recebimento
        </li>
      </ul>

      <div className={pageStyles.accordions}>
        <details className={pageStyles.accordion} open>
          <summary>
            Descrição
            <ChevronDownIcon />
          </summary>
          <div className={pageStyles.accordionBody}>
            {product.description.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </details>

        <details className={pageStyles.accordion}>
          <summary>
            Especificações técnicas
            <ChevronDownIcon />
          </summary>
          <div className={pageStyles.accordionBody}>
            <table className={pageStyles.specTable}>
              <tbody>
                {product.specs.map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className={pageStyles.accordion}>
          <summary>
            Envio e trocas
            <ChevronDownIcon />
          </summary>
          <div className={pageStyles.accordionBody}>
            <p>
              Pedidos confirmados até as 15h são despachados no mesmo dia útil. O prazo de entrega
              aparece no checkout após o cálculo do CEP.
            </p>
            <p>
              Não era o que você esperava? Você tem 7 dias corridos após o recebimento para
              solicitar a troca ou devolução sem custo.
            </p>
          </div>
        </details>
      </div>
    </>
  );

  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main className={pageStyles.page}>
        <div className="container">
          <nav aria-label="Você está em">
            <ol className={pageStyles.breadcrumb}>
              <li>
                <a href="/">Início</a>
              </li>
              <li>
                <a href="/produtos">Filamentos</a>
              </li>
              <li>
                <span aria-current="page">{product.name}</span>
              </li>
            </ol>
          </nav>

          <Reveal>
            <ProductView infoBottom={infoBottom} infoTop={infoTop} product={product} />
          </Reveal>

          <section aria-label="Produtos relacionados" className={pageStyles.related}>
            <Reveal className={storeStyles.sectionHead}>
              <div>
                <p className={storeStyles.sectionKicker}>Você também pode gostar</p>
                <h2 className={storeStyles.sectionTitle}>Produtos relacionados</h2>
              </div>
            </Reveal>
            <div className={storeStyles.productGrid}>
              {related.map((item, index) => (
                <Reveal delay={index * 80} key={item.slug}>
                  <ProductCard product={item} />
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
