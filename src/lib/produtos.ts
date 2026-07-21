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
};

function paraProduto(l: LinhaProduto): Product {
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
