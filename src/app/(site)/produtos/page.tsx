import type { Metadata } from "next";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ChevronDownIcon } from "@/components/site/icons";
import pageStyles from "@/components/site/pages.module.css";
import storeStyles from "@/components/site/store.module.css";
import type { Product } from "@/data/catalog";
import { listarFiltros, type CampoFiltro, type Filtro } from "@/lib/conteudo";
import { listarProdutos } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Todos os produtos | Triomax",
  description: "Filamentos de alta performance Triomax — PLA e PETG em seis cores.",
};

/* Rede de segurança: sem filtro ativo no banco a coluna da esquerda ficaria
   vazia ao lado da grade. */
const FILTROS_PADRAO: Filtro[] = [
  { id: "linha", nome: "Material", campo: "linha" },
  { id: "cor", nome: "Cor", campo: "cor" },
  { id: "preco", nome: "Preço", campo: "preco" },
];

/* A faixa de preço é a única opção que não sai de um valor da coluna: são dois
   intervalos fixos, como a loja sempre mostrou. */
const PRECO_LIMITE = 90;

/*
 * As contagens saem dos produtos de verdade, e não de números escritos à mão —
 * um produto novo no painel já aparece somado no filtro, sem deploy.
 */
function opcoesDoFiltro(produtos: Product[], campo: CampoFiltro): [string, number][] {
  if (campo === "preco") {
    const opcoes: [string, number][] = [
      ["Até R$ 90", produtos.filter((p) => p.price <= PRECO_LIMITE).length],
      ["Acima de R$ 90", produtos.filter((p) => p.price > PRECO_LIMITE).length],
    ];
    return opcoes.filter(([, total]) => total > 0);
  }

  const chave = campo === "linha" ? "line" : "color";
  const contagem = new Map<string, number>();
  for (const produto of produtos) {
    const valor = produto[chave];
    if (!valor) continue;
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  }

  /* Mais numerosos primeiro; empate mantém a ordem do catálogo. É o que
     reproduz a ordem que a listagem já tinha na mão. */
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function ProductsPage() {
  const [products, filtros] = await Promise.all([listarProdutos(), listarFiltros()]);

  const filterGroups = (filtros.length > 0 ? filtros : FILTROS_PADRAO)
    .map((filtro) => ({ title: filtro.nome, options: opcoesDoFiltro(products, filtro.campo) }))
    // Grupo sem opção só renderiza um acordeão vazio.
    .filter((grupo) => grupo.options.length > 0);

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
