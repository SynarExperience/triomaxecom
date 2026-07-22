import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/catalog";

/*
 * Leitura do catálogo no Supabase. O retorno é o mesmo tipo `Product` que a
 * vitrine já usava quando os produtos moravam num array — assim os componentes
 * de UI seguem iguais e só a origem do dado mudou.
 */

/** Colunas que compõem um `Product`. Explícitas para não trafegar campo à toa. */
const COLUNAS =
  "slug, nome, categoria, linha, cor, cor_hex, selo, preco, preco_comparativo, imagem, resumo, descricao, especificacoes";

/* A galeria só interessa à PDP: listagem e relacionados mostram uma foto só, e
   embutir `fotos_produto` ali seria trafegar dezenas de URLs sem uso. */
const COLUNAS_COM_FOTOS = `${COLUNAS}, fotos_produto(url, alt, posicao)`;

/**
 * Erros que o PostgREST devolve quando `fotos_produto` ainda não existe no
 * banco (migration 0007 não aplicada) — relacionamento ausente no schema cache
 * ou tabela inexistente. Só esses justificam repetir a consulta sem a galeria;
 * qualquer outra falha continua estourando.
 */
const ERROS_SEM_GALERIA = ["PGRST200", "PGRST205", "42P01"];

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
  descricao: string[] | null;
  especificacoes: [string, string][] | null;
  /** Ausente nas consultas sem embed e nos produtos que ainda não têm galeria. */
  fotos_produto?: LinhaFoto[] | null;
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
    description: l.descricao ?? [],
    specs: l.especificacoes ?? [],
  };
}

export async function listarProdutos(): Promise<Product[]> {
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

  if (!ERROS_SEM_GALERIA.includes(comGaleria.error.code)) {
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
