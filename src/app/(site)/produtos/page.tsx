import type { Metadata } from "next";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ChevronDownIcon } from "@/components/site/icons";
import pageStyles from "@/components/site/pages.module.css";
import storeStyles from "@/components/site/store.module.css";
import { listarProdutos } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Todos os produtos | Triomax",
  description: "Filamentos de alta performance Triomax — PLA e PETG em seis cores.",
};

const filterGroups: { title: string; options: [string, number][] }[] = [
  {
    title: "Material",
    options: [
      ["PLA", 4],
      ["PETG", 2],
    ],
  },
  {
    title: "Cor",
    options: [
      ["Branco", 1],
      ["Preto", 1],
      ["Amarelo", 1],
      ["Vermelho", 1],
      ["Azul", 1],
      ["Verde", 1],
    ],
  },
  {
    title: "Preço",
    options: [
      ["Até R$ 90", 4],
      ["Acima de R$ 90", 2],
    ],
  },
];

export default async function ProductsPage() {
  const products = await listarProdutos();

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
                <span aria-current="page">Todos os produtos</span>
              </li>
            </ol>
          </nav>

          <Reveal className={pageStyles.listingHead}>
            <div>
              <h1>Todos os produtos</h1>
              <p className={pageStyles.listingCount}>{products.length} produtos encontrados</p>
            </div>
            <label className={pageStyles.sortControl}>
              Ordenar por
              <select defaultValue="relevancia" name="sort">
                <option value="relevancia">Relevância</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="lancamentos">Lançamentos</option>
                <option value="mais-vendidos">Mais vendidos</option>
              </select>
            </label>
          </Reveal>

          <div className={pageStyles.listingLayout}>
            <aside aria-label="Filtros" className={pageStyles.filters}>
              {filterGroups.map((group, index) => (
                <details className={pageStyles.filterGroup} key={group.title} open={index < 2}>
                  <summary>
                    {group.title}
                    <ChevronDownIcon />
                  </summary>
                  <div className={pageStyles.filterOptions}>
                    {group.options.map(([label, count]) => (
                      <label className={pageStyles.filterOption} key={label}>
                        <input name={`${group.title}-${label}`} type="checkbox" />
                        {label}
                        <span>({count})</span>
                      </label>
                    ))}
                  </div>
                </details>
              ))}
            </aside>

            <div className={storeStyles.productGrid}>
              {products.map((product, index) => (
                <Reveal delay={(index % 4) * 70} key={product.slug}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
