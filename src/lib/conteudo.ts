import { supabase } from "@/lib/supabase";
import type { CategoryCard } from "@/data/catalog";

/*
 * Leitura do conteúdo editável no Supabase — frases da barra, banners, cards de
 * categoria e páginas institucionais. Mesmo desenho de `produtos.ts`: a função
 * devolve o tipo que a UI já usa, então trocar a origem do dado não mexe em
 * componente. O que o painel salva aparece aqui sem deploy.
 */

export type Aviso = {
  id: string;
  texto: string;
};

export type Banner = {
  id: string;
  posicao: "hero" | "promo";
  titulo: string;
  subtitulo: string;
  imagem: string;
  /** Arte alternativa para telas estreitas; vazia quando não há recorte próprio. */
  imagemMobile: string;
  alt: string;
  link: string;
};

export type Pagina = {
  slug: string;
  titulo: string;
  resumo: string;
  /** Blocos de parágrafo, no mesmo formato de `Product["description"]`. */
  conteudo: string[];
};

/** Resumo de página para listagens — sem o corpo, que não é usado ali. */
export type PaginaResumo = Omit<Pagina, "conteudo">;

type LinhaAviso = { id: string; texto: string };

type LinhaBanner = {
  id: string;
  posicao: string;
  titulo: string | null;
  subtitulo: string | null;
  imagem: string;
  imagem_mobile: string | null;
  alt: string | null;
  link: string | null;
};

type LinhaCard = {
  titulo: string;
  subtitulo: string | null;
  imagem: string | null;
  link: string;
};

type LinhaPagina = {
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string[] | null;
};

function paraBanner(l: LinhaBanner): Banner {
  return {
    id: l.id,
    posicao: l.posicao as Banner["posicao"],
    titulo: l.titulo ?? "",
    subtitulo: l.subtitulo ?? "",
    imagem: l.imagem,
    imagemMobile: l.imagem_mobile ?? "",
    alt: l.alt ?? l.titulo ?? "",
    link: l.link ?? "/produtos",
  };
}

function paraCard(l: LinhaCard): CategoryCard {
  return {
    title: l.titulo,
    subtitle: l.subtitulo ?? "",
    href: l.link,
    // `image` é opcional no tipo da UI: nulo no banco vira ausente aqui.
    ...(l.imagem ? { image: l.imagem } : {}),
  };
}

function paraPagina(l: LinhaPagina): Pagina {
  return {
    slug: l.slug,
    titulo: l.titulo,
    resumo: l.resumo ?? "",
    conteudo: l.conteudo ?? [],
  };
}

export async function listarAvisos(): Promise<Aviso[]> {
  const { data, error } = await supabase
    .from("avisos")
    .select("id, texto")
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(`Falha ao carregar avisos: ${error.message}`);
  return (data as LinhaAviso[]).map((l) => ({ id: l.id, texto: l.texto }));
}

export async function listarBanners(posicao?: Banner["posicao"]): Promise<Banner[]> {
  let consulta = supabase
    .from("banners")
    .select("id, posicao, titulo, subtitulo, imagem, imagem_mobile, alt, link")
    .eq("ativo", true);

  if (posicao) consulta = consulta.eq("posicao", posicao);

  const { data, error } = await consulta.order("ordem");

  if (error) throw new Error(`Falha ao carregar banners: ${error.message}`);
  return (data as LinhaBanner[]).map(paraBanner);
}

export async function listarCardsCategoria(): Promise<CategoryCard[]> {
  const { data, error } = await supabase
    .from("cards_categoria")
    .select("titulo, subtitulo, imagem, link")
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(`Falha ao carregar cards de categoria: ${error.message}`);
  return (data as LinhaCard[]).map(paraCard);
}

export async function buscarPagina(slug: string): Promise<Pagina | null> {
  const { data, error } = await supabase
    .from("paginas")
    .select("slug, titulo, resumo, conteudo")
    .eq("slug", slug)
    .eq("publicada", true)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar a página ${slug}: ${error.message}`);
  return data ? paraPagina(data as LinhaPagina) : null;
}

export async function listarPaginas(): Promise<PaginaResumo[]> {
  const { data, error } = await supabase
    .from("paginas")
    .select("slug, titulo, resumo")
    .eq("publicada", true)
    .order("titulo");

  if (error) throw new Error(`Falha ao carregar páginas: ${error.message}`);
  return (data as LinhaPagina[]).map((l) => ({
    slug: l.slug,
    titulo: l.titulo,
    resumo: l.resumo ?? "",
  }));
}
