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
  /**
   * Nome do arquivo sem largura nem extensão (ex.: `banner-pla-petg`). É daqui
   * que o hero monta o srcset das cinco resoluções — guardar um caminho único
   * serviria o master 4K para o celular.
   */
  nomeBase: string;
  /** Caminho fixo; sobra do modelo antigo e não é usado pelo hero. */
  imagem: string;
  /** Arte alternativa para telas estreitas; vazia quando não há recorte próprio. */
  imagemMobile: string;
  alt: string;
  /** aria-label do botão que leva ao slide. */
  rotulo: string;
  link: string;
};

/** Um nível de profundidade: subitens vêm agrupados dentro do pai. */
export type ItemMenu = {
  id: string;
  rotulo: string;
  destino: string;
  /** Item que salta da barra (o "Ofertas" dourado). Vem do banco em vez de ser
      deduzido do rótulo, senão renomear o item apagaria o destaque. */
  destaque: boolean;
  subitens: ItemMenu[];
};

/** Coluna de `produtos` de onde as opções do filtro saem. */
export type CampoFiltro = "linha" | "cor" | "preco";

export type Filtro = {
  id: string;
  nome: string;
  campo: CampoFiltro;
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
  nome_base: string | null;
  imagem: string | null;
  imagem_mobile: string | null;
  alt: string | null;
  rotulo: string | null;
  link: string | null;
};

type LinhaItemMenu = {
  destaque?: boolean | null;
  id: string;
  pai_id: string | null;
  rotulo: string;
  destino: string;
};

type LinhaFiltro = {
  id: string;
  nome: string;
  campo: string;
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
    nomeBase: l.nome_base ?? "",
    imagem: l.imagem ?? "",
    imagemMobile: l.imagem_mobile ?? "",
    alt: l.alt ?? l.titulo ?? "",
    rotulo: l.rotulo ?? l.alt ?? l.titulo ?? "",
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
    .select("id, posicao, titulo, subtitulo, nome_base, imagem, imagem_mobile, alt, rotulo, link")
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

/** Itens ativos de um menu ('principal' | 'rodape'), na ordem do painel. */
export async function listarMenu(chave: string): Promise<ItemMenu[]> {
  const { data: menu, error: erroMenu } = await supabase
    .from("menus")
    .select("id")
    .eq("chave", chave)
    .maybeSingle();

  if (erroMenu) throw new Error(`Falha ao carregar o menu ${chave}: ${erroMenu.message}`);
  if (!menu) return [];

  const { data, error } = await supabase
    .from("itens_menu")
    .select("id, pai_id, rotulo, destino, destaque")
    .eq("menu_id", (menu as { id: string }).id)
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(`Falha ao carregar os itens do menu ${chave}: ${error.message}`);

  const linhas = data as LinhaItemMenu[];
  const nos = new Map<string, ItemMenu>();
  for (const l of linhas) {
    nos.set(l.id, { id: l.id, rotulo: l.rotulo, destino: l.destino, destaque: l.destaque ?? false, subitens: [] });
  }

  const raiz: ItemMenu[] = [];
  for (const l of linhas) {
    const no = nos.get(l.id);
    if (!no) continue;

    const pai = l.pai_id ? nos.get(l.pai_id) : undefined;
    /* Pai inativo (ou de outro menu) não vem na consulta: o filho sobe para a
       raiz em vez de sumir do menu sem explicação. */
    if (pai) pai.subitens.push(no);
    else raiz.push(no);
  }

  return raiz;
}

/** Filtros ativos da listagem. As contagens são feitas na página, sobre os produtos. */
export async function listarFiltros(): Promise<Filtro[]> {
  const { data, error } = await supabase
    .from("filtros")
    .select("id, nome, campo")
    .eq("ativo", true)
    .order("ordem");

  if (error) throw new Error(`Falha ao carregar filtros: ${error.message}`);

  const conhecidos: CampoFiltro[] = ["linha", "cor", "preco"];
  return (data as LinhaFiltro[])
    // Campo que a vitrine não sabe contar viraria um grupo vazio na tela.
    .filter((l): l is LinhaFiltro & { campo: CampoFiltro } =>
      conhecidos.includes(l.campo as CampoFiltro),
    )
    .map((l) => ({ id: l.id, nome: l.nome, campo: l.campo }));
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
