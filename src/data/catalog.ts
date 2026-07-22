export type ProductImage = {
  url: string;
  alt: string;
};

export type Product = {
  slug: string;
  name: string;
  category: "Filamentos";
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
  description: string[];
  specs: [string, string][];
};

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pixPrice = (value: number) => value * 0.9;

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
