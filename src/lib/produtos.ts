import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/catalog";

/*
 * Leitura do catálogo no Supabase. O retorno é o mesmo tipo `Product` que a
 * vitrine já usava quando os produtos moravam num array — assim os componentes
 * de UI seguem iguais e só a origem do dado mudou.
 */

/* `estoque` entra em todas as consultas porque é ele que decide se o card mostra
   o botão de comprar ou a tarja de esgotado — e isso vale na home, na listagem e
   na PDP. A tabela existe desde a primeira migração, então o embed não precisa
   do tratamento de "tabela ausente" que a galeria e as categorias exigem. */
/** Colunas que compõem um `Product`. Explícitas para não trafegar campo à toa. */
const COLUNAS =
  "slug, nome, categoria, linha, cor, cor_hex, selo, preco, preco_comparativo, imagem, resumo, descricao, especificacoes, seo_titulo, seo_descricao, estoque(quantidade)";

/* Variações do produto (a RLS da anon key só entrega as ativas). O estoque de
   cada uma vem aninhado da mesma `estoque` que o produto usa — lá a linha tem
   `variacao_id` em vez de `produto_id`. */
const EMBED_VARIACOES = "variacoes(id, nome, sku, preco, estoque(quantidade))";

/* As categorias vêm no mesmo embed da listagem porque é ela que filtra por
   elas — buscar depois, produto a produto, seria uma consulta por card. A
   galeria entra junto porque o card troca para a segunda foto no hover; só as
   duas primeiras interessam ali, mas o custo de trazer as demais é irrisório. */
const COLUNAS_COM_CATEGORIAS = `${COLUNAS}, produtos_categorias(categorias(slug)), fotos_produto(url, alt, posicao), ${EMBED_VARIACOES}`;

/* A PDP monta a tira de miniaturas com a galeria inteira. */
const COLUNAS_COM_FOTOS = `${COLUNAS}, fotos_produto(url, alt, posicao), ${EMBED_VARIACOES}`;

/**
 * Erros que o PostgREST devolve quando a tabela embutida ainda não existe —
 * relacionamento ausente no schema cache ou tabela inexistente. Vale para as
 * duas migrações que a vitrine pode estar esperando: `fotos_produto` (0007) e
 * `categorias`/`produtos_categorias` (0008).
 *
 * Só esses justificam repetir a consulta sem o embed. Qualquer outra falha
 * continua estourando, senão um erro de verdade viraria "loja sem produto".
 */
const ERROS_SEM_TABELA = ["PGRST200", "PGRST205", "42P01"];

type LinhaFoto = {
  url: string;
  alt: string | null;
  posicao: number;
};

type LinhaProduto = {
  slug: string;
  nome: string;
  categoria: string;
  linha: string | null;
  cor: string | null;
  cor_hex: string | null;
  selo: string | null;
  preco: number;
  preco_comparativo: number | null;
  imagem: string | null;
  resumo: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  descricao: string[] | null;
  especificacoes: [string, string][] | null;
  /* Vem como lista porque é embed de tabela filha, mas o banco garante no
     máximo uma linha por produto (índice único em `estoque.produto_id`). */
  estoque?: { quantidade: number }[] | null;
  /** Ausente nas consultas sem embed e nos produtos que ainda não têm galeria. */
  fotos_produto?: LinhaFoto[] | null;
  /** Ausente nas consultas sem embed e nos produtos sem categoria. */
  produtos_categorias?: { categorias: { slug: string } | null }[] | null;
  /** Ausente nas consultas sem o embed (relacionados e fallbacks). */
  variacoes?:
    | {
        id: string;
        nome: string;
        sku: string | null;
        preco: number | null;
        estoque?: { quantidade: number }[] | null;
      }[]
    | null;
};

function paraProduto(l: LinhaProduto): Product {
  /* A ordem por posição vem da consulta; aqui só se descarta linha sem URL, que
     viraria um espaço vazio na tira de miniaturas. */
  const fotos = (l.fotos_produto ?? [])
    .filter((f) => Boolean(f.url))
    .map((f) => ({ url: f.url, alt: f.alt || l.nome }));

  // Sem galeria (ou sem o embed), a foto única sustenta sozinha a PDP.
  const unica = l.imagem ? [{ url: l.imagem, alt: l.nome }] : [];

  return {
    slug: l.slug,
    name: l.nome,
    category: l.categoria as Product["category"],
    line: l.linha ?? "",
    color: l.cor ?? "",
    colorHex: l.cor_hex ?? "",
    // `badge` e `compareAt` são opcionais: nulo no banco vira ausente aqui.
    ...(l.selo ? { badge: l.selo as Product["badge"] } : {}),
    price: Number(l.preco),
    ...(l.preco_comparativo != null ? { compareAt: Number(l.preco_comparativo) } : {}),
    image: l.imagem ?? "",
    images: fotos.length > 0 ? fotos : unica,
    short: l.resumo ?? "",
    /* SEO preenchido no painel; ausente, o <head> cai no nome/resumo. */
    ...(l.seo_titulo ? { seoTitle: l.seo_titulo as string } : {}),
    ...(l.seo_descricao ? { seoDescription: l.seo_descricao as string } : {}),
    description: l.descricao ?? [],
    specs: l.especificacoes ?? [],
    /* Só os slugs: a listagem compara com o da URL, e o nome de exibição ela
       já tem por `listarCategorias()`. */
    categories: (l.produtos_categorias ?? [])
      .map((v) => v.categorias?.slug)
      .filter((s): s is string => Boolean(s)),
    /* Produto sem linha de estoque fica `null` — "não controlado", e não
       "esgotado". Ver `isSoldOut` em `@/data/catalog`. */
    stock: l.estoque?.[0] ? Number(l.estoque[0].quantidade) : null,
    /* Consulta sem o embed (relacionados/fallback) vira lista vazia — o
       produto se comporta como simples ali, e a PDP, que tem o embed, é quem
       manda na escolha da variação. */
    variants: (l.variacoes ?? []).map((v) => ({
      id: v.id,
      name: v.nome,
      sku: v.sku ?? null,
      price: v.preco != null ? Number(v.preco) : null,
      stock: v.estoque?.[0] ? Number(v.estoque[0].quantidade) : null,
    })),
  };
}

export async function listarProdutos(): Promise<Product[]> {
  const comCategorias = await supabase
    .from("produtos")
    .select(COLUNAS_COM_CATEGORIAS)
    .eq("ativo", true)
    .order("linha")
    .order("nome")
    // Menor posição primeiro: `images[0]` é a foto principal e `images[1]` a que
    // aparece no hover do card.
    .order("posicao", { referencedTable: "fotos_produto" });

  if (!comCategorias.error) {
    return (comCategorias.data as unknown as LinhaProduto[]).map(paraProduto);
  }

  if (!ERROS_SEM_TABELA.includes(comCategorias.error.code)) {
    throw new Error(`Falha ao carregar produtos: ${comCategorias.error.message}`);
  }

  /* Banco ainda sem a taxonomia (migração 0008): a listagem continua de pé,
     só sem o filtro de categoria — mesma degradação da galeria. */
  const { data, error } = await supabase
    .from("produtos")
    .select(COLUNAS)
    .eq("ativo", true)
    .order("linha")
    .order("nome");

  if (error) throw new Error(`Falha ao carregar produtos: ${error.message}`);
  return (data as LinhaProduto[]).map(paraProduto);
}

export async function buscarProduto(slug: string): Promise<Product | null> {
  const comGaleria = await supabase
    .from("produtos")
    .select(COLUNAS_COM_FOTOS)
    .eq("slug", slug)
    .eq("ativo", true)
    // Menor posição primeiro: a PDP abre já na foto principal.
    .order("posicao", { referencedTable: "fotos_produto" })
    .maybeSingle();

  if (!comGaleria.error) {
    return comGaleria.data ? paraProduto(comGaleria.data as unknown as LinhaProduto) : null;
  }

  if (!ERROS_SEM_TABELA.includes(comGaleria.error.code)) {
    throw new Error(`Falha ao carregar o produto ${slug}: ${comGaleria.error.message}`);
  }

  /* Banco ainda sem a tabela da galeria: repete a consulta antiga para a PDP
     continuar de pé com a foto única, em vez de derrubar a página. */
  const { data, error } = await supabase
    .from("produtos")
    .select(COLUNAS)
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar o produto ${slug}: ${error.message}`);
  return data ? paraProduto(data as LinhaProduto) : null;
}

export async function produtosRelacionados(slug: string, limite = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select(COLUNAS)
    .eq("ativo", true)
    .neq("slug", slug)
    .limit(limite);

  if (error) throw new Error(`Falha ao carregar relacionados de ${slug}: ${error.message}`);
  return (data as LinhaProduto[]).map(paraProduto);
}
