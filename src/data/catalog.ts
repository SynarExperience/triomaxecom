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
  image: string;
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

export const categoryCards: CategoryCard[] = [
  {
    title: "PLA",
    subtitle: "O dia a dia da impressão 3D",
    href: "/produtos",
    image: "/banners/categories/linha-pla",
  },
  {
    title: "PETG",
    subtitle: "Resistência para peças funcionais",
    href: "/produtos",
    image: "/banners/categories/linha-petg",
  },
];

export const navCategories = ["PLA", "PETG"] as const;
