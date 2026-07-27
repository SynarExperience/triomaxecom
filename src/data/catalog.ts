export type ProductImage = {
  url: string;
  alt: string;
};

/** Variação vendável (ex.: "1 kg", "500 g"). Só as ativas chegam à vitrine —
    a RLS do banco já filtra. */
export type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  /** Nulo herda o preço do produto — ver `variantPrice`. */
  price: number | null;
  /** Mesma semântica do estoque do produto: nulo = não controlado, 0 = esgotada. */
  stock: number | null;
};

export type Product = {
  slug: string;
  name: string;
  /**
   * Coluna antiga `produtos.categoria`, texto solto e igual em todo o catálogo.
   * Continua aqui porque a loja ainda a exibe em alguns lugares, mas quem
   * organiza o catálogo agora é `categories` — a taxonomia de verdade.
   */
  category: string;
  line: string;
  color: string;
  colorHex: string;
  badge?: "Lançamento" | "Mais vendido" | "Oferta" | "Outlet";
  price: number;
  compareAt?: number;
  /** Foto principal — a de menor posição na galeria. Usada em card e sacola. */
  image: string;
  /**
   * Galeria da PDP, já na ordem de exibição (a primeira é a principal). Nunca
   * fica vazia enquanto houver `image`: quando não há galeria no banco ela cai
   * para a foto única, então a PDP nunca precisa tratar os dois casos.
   */
  images: ProductImage[];
  short: string;
  /** Título/descrição para o <head> (SEO), vindos do painel. Ausentes, a
      página usa nome e `short`. */
  seoTitle?: string;
  seoDescription?: string;
  description: string[];
  specs: [string, string][];
  /**
   * Slugs das categorias do produto. Um produto pode estar na categoria-mãe e
   * na filha ao mesmo tempo, então isto é uma lista, não um valor.
   * Vazia quando a taxonomia ainda não foi aplicada no banco.
   */
  categories: string[];
  /**
   * Quantidade em estoque. `null` quando o produto não tem linha de estoque no
   * banco — que é diferente de zero: zero é "acabou", nulo é "não controlado".
   * Só o zero esgota o produto na loja; o nulo mantém a compra liberada, senão
   * um cadastro incompleto tiraria o item de venda sem ninguém pedir.
   */
  stock: number | null;
  /**
   * Variações do produto. Vazia = produto simples, comportamento idêntico ao
   * de sempre. Com itens, a PDP obriga a escolha de uma, o carrinho identifica
   * o item por produto+variação e o estoque conta por variação.
   */
  variants: ProductVariant[];
};

/** Preço efetivo de uma variação: o dela ou, se nulo, o do produto. */
export const variantPrice = (product: Product, variant: ProductVariant) =>
  variant.price ?? product.price;

export const isVariantSoldOut = (variant: ProductVariant) => variant.stock === 0;

/** Produto sem unidade disponível: a loja troca as ações de compra por "Esgotado".
    Com variações, esgotado é quando TODAS esgotaram — o estoque do produto em si
    deixa de valer. */
export const isSoldOut = (product: Product) =>
  product.variants.length > 0
    ? product.variants.every(isVariantSoldOut)
    : product.stock === 0;

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const installment = (value: number, times = 12) => value / times;

export type CategoryCard = {
  title: string;
  subtitle: string;
  href: string;
  /**
   * Caminho sem extensão — o componente monta as variações do `srcset`
   * (`-512.webp`, `-1024.webp`) geradas por `scripts/optimize-assets.mjs`.
   */
  image?: string;
  tone?: string;
};

/* Os cards em si vivem na tabela `cards_categoria` — ver `listarCardsCategoria`
   em `@/lib/conteudo`. Aqui fica só o formato que a UI espera. */

export const navCategories = ["PLA", "PETG"] as const;
