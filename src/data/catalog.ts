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

const plaSpecs: [string, string][] = [
  ["Diâmetro", "1,75 mm ± 0,02"],
  ["Peso líquido", "1 kg"],
  ["Temperatura do bico", "195–220 °C"],
  ["Temperatura da mesa", "50–60 °C"],
];

const petgSpecs: [string, string][] = [
  ["Diâmetro", "1,75 mm ± 0,02"],
  ["Peso líquido", "1 kg"],
  ["Temperatura do bico", "230–255 °C"],
  ["Temperatura da mesa", "70–80 °C"],
];

const plaDescription = (cor: string) => [
  `O Filamento PLA ${cor} da Triomax imprime fácil, adere bem à mesa e mantém a cor uniforme do primeiro ao último metro do carretel.`,
  "Bobinagem de precisão que evita nós e travamentos no meio da impressão. Ideal para protótipos, peças de decoração e uso diário.",
];

const petgDescription = (cor: string) => [
  `O Filamento PETG ${cor} da Triomax aguenta impacto, umidade e sol — a escolha certa para peças funcionais que vivem fora da bancada.`,
  "Imprime com pouca contração e ótima adesão entre camadas.",
];

export const products: Product[] = [
  {
    slug: "filamento-pla-branco",
    name: "Filamento PLA Branco",
    category: "Filamentos",
    line: "PLA",
    color: "Branco",
    colorHex: "#f4f4f2",
    badge: "Mais vendido",
    price: 89.9,
    image: "/products/filamento-branco.webp",
    short: "PLA branco de impressão fácil e cor uniforme. 1 kg, 1,75 mm.",
    description: plaDescription("Branco"),
    specs: plaSpecs,
  },
  {
    slug: "filamento-pla-preto",
    name: "Filamento PLA Preto",
    category: "Filamentos",
    line: "PLA",
    color: "Preto",
    colorHex: "#1a1a1a",
    badge: "Mais vendido",
    price: 89.9,
    image: "/products/filamento-preto.webp",
    short: "PLA preto com acabamento limpo e consistente. 1 kg, 1,75 mm.",
    description: plaDescription("Preto"),
    specs: plaSpecs,
  },
  {
    slug: "filamento-pla-amarelo",
    name: "Filamento PLA Amarelo",
    category: "Filamentos",
    line: "PLA",
    color: "Amarelo",
    colorHex: "#f7c400",
    price: 89.9,
    image: "/products/filamento-amarelo.webp",
    short: "PLA amarelo vibrante para peças que chamam atenção. 1 kg, 1,75 mm.",
    description: plaDescription("Amarelo"),
    specs: plaSpecs,
  },
  {
    slug: "filamento-pla-vermelho",
    name: "Filamento PLA Vermelho",
    category: "Filamentos",
    line: "PLA",
    color: "Vermelho",
    colorHex: "#d5262c",
    badge: "Oferta",
    price: 79.9,
    compareAt: 89.9,
    image: "/products/filamento-vermelho.webp",
    short: "PLA vermelho intenso com cor sólida e uniforme. 1 kg, 1,75 mm.",
    description: plaDescription("Vermelho"),
    specs: plaSpecs,
  },
  {
    slug: "filamento-petg-azul",
    name: "Filamento PETG Azul",
    category: "Filamentos",
    line: "PETG",
    color: "Azul",
    colorHex: "#1740c7",
    badge: "Lançamento",
    price: 99.9,
    image: "/products/filamento-azul.webp",
    short: "PETG azul resistente para peças funcionais. 1 kg, 1,75 mm.",
    description: petgDescription("Azul"),
    specs: petgSpecs,
  },
  {
    slug: "filamento-petg-verde",
    name: "Filamento PETG Verde",
    category: "Filamentos",
    line: "PETG",
    color: "Verde",
    colorHex: "#1c9d4d",
    price: 99.9,
    image: "/products/filamento-verde.webp",
    short: "PETG verde com alta resistência mecânica e química. 1 kg, 1,75 mm.",
    description: petgDescription("Verde"),
    specs: petgSpecs,
  },
];

export const featuredProducts = products;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const relatedProducts = (slug: string) =>
  products.filter((p) => p.slug !== slug).slice(0, 4);

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
