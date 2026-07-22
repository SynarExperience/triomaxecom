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
import { listarCategorias, type Categoria } from "@/lib/categorias";
import { listarFiltros, type CampoFiltro, type Filtro } from "@/lib/conteudo";
import { listarProdutos } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Todos os produtos | Triomax",
  description: "Filamentos de alta performance Triomax — PLA e PETG em seis cores.",
};

/* Rede de segurança: sem filtro ativo no banco a coluna da esquerda ficaria
   vazia ao lado da grade. */
const FILTROS_PADRAO: Filtro[] = [
  { id: "categoria", nome: "Categoria", campo: "categoria" },
  { id: "linha", nome: "Material", campo: "linha" },
  { id: "cor", nome: "Cor", campo: "cor" },
  { id: "preco", nome: "Preço", campo: "preco" },
];

/* A faixa de preço é a única opção que não sai de um valor da coluna: são dois
   intervalos fixos, como a loja sempre mostrou. */
const PRECO_LIMITE = 90;
const ATE_LIMITE = `Até R$ ${PRECO_LIMITE}`;
const ACIMA_LIMITE = `Acima de R$ ${PRECO_LIMITE}`;

/** Uma opção de filtro: o rótulo que aparece e o valor que vai para a URL. */
type Opcao = { rotulo: string; valor: string; total: number };

/*
 * As contagens saem dos produtos de verdade, e não de números escritos à mão —
 * um produto novo no painel já aparece somado no filtro, sem deploy.
 */
function opcoesDoFiltro(
  produtos: Product[],
  campo: CampoFiltro,
  categorias: Categoria[],
): Opcao[] {
  if (campo === "preco") {
    return [
      {
        rotulo: ATE_LIMITE,
        valor: "ate",
        total: produtos.filter((p) => p.price <= PRECO_LIMITE).length,
      },
      {
        rotulo: ACIMA_LIMITE,
        valor: "acima",
        total: produtos.filter((p) => p.price > PRECO_LIMITE).length,
      },
    ].filter((o) => o.total > 0);
  }

  if (campo === "categoria") {
    /* A ordem vem da árvore montada no painel, não da contagem: categoria é
       navegação, e navegação que se reordena sozinha confunde quem já sabe
       onde clicar. O nível vira indentação no rótulo. */
    return categorias
      .map((c) => ({
        rotulo: `${"  ".repeat(c.nivel)}${c.nome}`,
        valor: c.slug,
        total: produtos.filter((p) => p.categories.includes(c.slug)).length,
      }))
      .filter((o) => o.total > 0);
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
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([rotulo, total]) => ({ rotulo, valor: rotulo, total }));
}

/* Ordenações que têm dado por trás. "Mais vendidos" saiu da lista: não existe
   contagem de vendas por produto no catálogo, e a opção só fingiria ordenar. */
const ORDENS = {
  relevancia: { rotulo: "Relevância", comparar: null },
  "menor-preco": { rotulo: "Menor preço", comparar: (a: Product, b: Product) => a.price - b.price },
  "maior-preco": { rotulo: "Maior preço", comparar: (a: Product, b: Product) => b.price - a.price },
  "a-z": {
    rotulo: "A - Z",
    comparar: (a: Product, b: Product) => a.name.localeCompare(b.name, "pt-BR"),
  },
  "z-a": {
    rotulo: "Z - A",
    comparar: (a: Product, b: Product) => b.name.localeCompare(a.name, "pt-BR"),
  },
} as const;

type Ordem = keyof typeof ORDENS;

const ehOrdem = (v: string | null): v is Ordem => v !== null && v in ORDENS;

/** Valores marcados de um campo. A URL aceita repetição (`?cor=Azul&cor=Verde`). */
function selecionados(params: URLSearchParams, campo: CampoFiltro): string[] {
  return params.getAll(campo).filter(Boolean);
}

/** Um produto passa quando atende a TODOS os campos filtrados — e, dentro de um
    campo, a QUALQUER um dos valores marcados. É o comportamento que qualquer
    loja tem: marcar Azul e Verde soma cores, marcar PLA e Azul restringe. */
function passaNoFiltro(produto: Product, params: URLSearchParams): boolean {
  const categorias = selecionados(params, "categoria");
  if (categorias.length > 0 && !categorias.some((c) => produto.categories.includes(c))) {
    return false;
  }

  const linhas = selecionados(params, "linha");
  if (linhas.length > 0 && !linhas.includes(produto.line)) return false;

  const cores = selecionados(params, "cor");
  if (cores.length > 0 && !cores.includes(produto.color)) return false;

  const precos = selecionados(params, "preco");
  if (precos.length > 0) {
    const faixa = produto.price <= PRECO_LIMITE ? "ate" : "acima";
    if (!precos.includes(faixa)) return false;
  }

  return true;
}

/**
 * URL com uma opção ligada ou desligada, preservando o resto dos filtros.
 *
 * O filtro é um link e não um formulário de propósito: assim a listagem segue
 * server component, o estado mora na URL (dá para compartilhar e voltar no
 * histórico) e funciona antes de qualquer JavaScript carregar.
 */
function alternarNaUrl(params: URLSearchParams, campo: CampoFiltro, valor: string): string {
  const novo = new URLSearchParams(params);
  const atuais = novo.getAll(campo);

  novo.delete(campo);
  for (const v of atuais) {
    if (v !== valor) novo.append(campo, v);
  }
  if (!atuais.includes(valor)) novo.append(campo, valor);

  const query = novo.toString();
  return query ? `/produtos?${query}` : "/produtos";
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const [products, filtros, categorias, busca] = await Promise.all([
    listarProdutos(),
    listarFiltros(),
    listarCategorias(),
    searchParams,
  ]);

  /* `searchParams` chega como objeto com valores repetidos em array; o
     URLSearchParams normaliza os dois casos num só. */
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(busca)) {
    for (const v of Array.isArray(valor) ? valor : valor ? [valor] : []) {
      params.append(chave, v);
    }
  }

  const ordemUrl = params.get("ordem");
  const ordem: Ordem = ehOrdem(ordemUrl) ? ordemUrl : "relevancia";
  const comparar = ORDENS[ordem].comparar;

  const filtrados = products.filter((p) => passaNoFiltro(p, params));
  /* "Relevância" é a ordem que veio do banco (linha, depois nome) — sem
     comparador, e sem cópia desnecessária do array. */
  const visiveis = comparar ? [...filtrados].sort(comparar) : filtrados;

  /* `ordem` não conta como filtro: ordenar não esconde produto, então não deve
     acender o "Limpar filtros" nem o "de N". */
  const filtrando = [...params.keys()].some((k) => k !== "ordem");

  const filterGroups = (filtros.length > 0 ? filtros : FILTROS_PADRAO)
    .map((filtro) => ({
      title: filtro.nome,
      campo: filtro.campo,
      /* As opções saem do catálogo inteiro, não do resultado filtrado: se
         saíssem do resultado, marcar "Azul" apagaria as outras cores da lista
         e não haveria como desmarcar nem comparar. */
      options: opcoesDoFiltro(products, filtro.campo, categorias),
    }))
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
              <p className={pageStyles.listingCount}>
                {visiveis.length} produto{visiveis.length === 1 ? "" : "s"} encontrado
                {visiveis.length === 1 ? "" : "s"}
                {filtrando ? ` de ${products.length}` : ""}
              </p>
            </div>
            <div className={pageStyles.listingActions}>
              {filtrando && (
                <a className={pageStyles.filterClear} href="/produtos">
                  Limpar filtros
                </a>
              )}

              {/* <form method="get"> em vez de onChange: mantém a página server
                  component e a ordenação funciona antes do JS carregar. Os
                  filtros ativos viajam em campos ocultos para ordenar não
                  desfazer o que já estava marcado. */}
              <form action="/produtos" className={pageStyles.sortControl} method="get">
                {[...params.entries()]
                  .filter(([chave]) => chave !== "ordem")
                  .map(([chave, valor]) => (
                    <input key={`${chave}-${valor}`} name={chave} type="hidden" value={valor} />
                  ))}
                <label htmlFor="ordem">Ordenar por</label>
                <select defaultValue={ordem} id="ordem" name="ordem">
                  {Object.entries(ORDENS).map(([valor, { rotulo }]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>
                <button type="submit">Aplicar</button>
              </form>
            </div>
          </Reveal>

          <div className={pageStyles.listingLayout}>
            <aside aria-label="Filtros" className={pageStyles.filters}>
              {filterGroups.map((group, index) => {
                const marcados = selecionados(params, group.campo);
                return (
                  <details
                    className={pageStyles.filterGroup}
                    key={group.title}
                    /* Grupo com filtro ativo abre sempre: fechado, esconderia o
                       motivo de a grade estar curta. */
                    open={index < 2 || marcados.length > 0}
                  >
                    <summary>
                      {group.title}
                      <ChevronDownIcon />
                    </summary>
                    <div className={pageStyles.filterOptions}>
                      {group.options.map((opcao) => {
                        const ativo = marcados.includes(opcao.valor);
                        return (
                          <a
                            className={`${pageStyles.filterOption} ${
                              ativo ? pageStyles.filterOptionActive : ""
                            }`}
                            href={alternarNaUrl(params, group.campo, opcao.valor)}
                            key={opcao.valor}
                            /* Link que representa estado ligado/desligado: sem
                               isso o leitor de tela anuncia só "link". */
                            aria-pressed={ativo}
                            role="button"
                            rel="nofollow"
                          >
                            <span aria-hidden="true" className={pageStyles.filterBox}>
                              {ativo ? "✓" : ""}
                            </span>
                            {opcao.rotulo}
                            <span>({opcao.total})</span>
                          </a>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </aside>

            <div className={storeStyles.productGrid}>
              {visiveis.length === 0 ? (
                <p className={pageStyles.listingEmpty}>
                  Nenhum produto com esses filtros.{" "}
                  <a href="/produtos">Limpar e ver tudo</a>.
                </p>
              ) : (
                visiveis.map((product, index) => (
                  <Reveal delay={(index % 4) * 70} key={product.slug}>
                    <ProductCard product={product} />
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
