/**
 * Dados de exemplo da tela de Produtos.
 *
 * ESTRUTURA tirada do painel real (docs/nuvemshop-admin-mapa.md):
 * tabela `Produto | Estoque | Preço | Promocional | Variações | Ações`,
 * preço e promocional editáveis na própria linha, estoque por variação com
 * "Sem estoque" quando zerado, e busca por nome, SKU ou tags.
 * DADOS são fictícios.
 */

export interface Variacao {
  /** Ex.: "36 / Preto" — a combinação exibida na coluna Variações. */
  nome: string;
  estoque: number | null; // null = sem controle de estoque
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  tags: string[];
  preco: number;
  promocional: number | null;
  /** Estoque único (produto sem variação). Ignorado quando há variações. */
  estoque: number | null;
  variacoes: Variacao[];
}

export const PRODUTOS: Produto[] = [
  {
    id: "p-01",
    nome: "Gloss Labial Caramelo",
    sku: "GL-CR-01",
    tags: ["brilho labial", "gloss caramelo", "gloss hidratante"],
    preco: 59.2,
    promocional: 49.9,
    estoque: 200,
    variacoes: [],
  },
  {
    id: "p-02",
    nome: "Gloss Labial Rosé",
    sku: "GL-RS-01",
    tags: ["brilho labial", "gloss rosa", "gloss leve"],
    preco: 59.2,
    promocional: null,
    estoque: 200,
    variacoes: [],
  },
  {
    id: "p-03",
    nome: "Esponja de Maquiagem Mocha",
    sku: "RE001",
    tags: ["esponja", "maquiagem"],
    preco: 24.0,
    promocional: null,
    estoque: 100,
    variacoes: [],
  },
  {
    id: "p-04",
    nome: "Sapatilha Clássica Rosa",
    sku: "SP-RS",
    tags: ["sapatilha", "rosa"],
    preco: 189.9,
    promocional: 159.9,
    estoque: null,
    variacoes: [
      { nome: "34 / Pink", estoque: 0 },
      { nome: "35 / Pink", estoque: 0 },
      { nome: "36 / Pink", estoque: 3 },
      { nome: "37 / Pink", estoque: 3 },
      { nome: "38 / Pink", estoque: 0 },
      { nome: "39 / Pink", estoque: 0 },
    ],
  },
  {
    id: "p-05",
    nome: "Sapatilha Bico Fino Dourada",
    sku: "SP-DR",
    tags: ["sapatilha", "dourado", "festa"],
    preco: 191.05,
    promocional: null,
    estoque: null,
    variacoes: [
      { nome: "34 / Dourado", estoque: 3 },
      { nome: "35 / Dourado", estoque: 0 },
      { nome: "36 / Dourado", estoque: 6 },
      { nome: "37 / Dourado", estoque: 0 },
      { nome: "38 / Dourado", estoque: 0 },
      { nome: "39 / Dourado", estoque: 0 },
    ],
  },
  {
    id: "p-06",
    nome: "Bota Cano Alto Preta",
    sku: "BT-PT",
    tags: ["bota", "cano alto", "preto"],
    preco: 298.0,
    promocional: null,
    estoque: null,
    variacoes: [
      { nome: "34 / Preto", estoque: 0 },
      { nome: "35 / Preto", estoque: 0 },
      { nome: "36 / Preto", estoque: 0 },
      { nome: "37 / Preto", estoque: 0 },
      { nome: "38 / Preto", estoque: 0 },
      { nome: "39 / Preto", estoque: 0 },
    ],
  },
];

/** Categorias do filtro lateral, como no painel real. */
export const CATEGORIAS = [
  "Todos",
  "Sem categoria",
  "Botas",
  "Cano alto",
  "Cano médio",
  "Coturno",
  "Sapato",
  "Maquiagem",
];

export const ORDENACOES = [
  "Menor preço",
  "Maior preço",
  "A - Z",
  "Z - A",
  "Mais antigo",
  "Mais novo",
];

/** Estoque total: soma das variações, ou o estoque único. */
export function estoqueTotal(p: Produto): number | null {
  if (p.variacoes.length === 0) return p.estoque;
  return p.variacoes.reduce((s, v) => s + (v.estoque ?? 0), 0);
}

/** Rótulo da coluna Estoque — o painel real escreve "Sem estoque" quando zero. */
export function rotuloEstoque(p: Produto): string {
  const total = estoqueTotal(p);
  if (total === null) return "Infinito";
  return total === 0 ? "Sem estoque" : String(total);
}

export function rotuloVariacoes(p: Produto): string {
  if (p.variacoes.length === 0) return "—";
  return `${p.variacoes.length} variações`;
}
