/**
 * Dados de exemplo de Descontos.
 *
 * ESTRUTURA das três tabelas veio do painel real (docs/nuvemshop-admin-mapa.md):
 *   Cupons       — Código | Desconto | Frete | Vigência | Usos | Limites | Status | Ações
 *   Promoções    — Nome | Tipo de desconto | Aplicar a | Vigência | Status | Ações
 *   Frete grátis — Meio de envio | Preço mínimo | Categorias | Zonas de entrega | Status | Ações
 * DADOS são fictícios.
 */

export type Status = "ativo" | "inativo";

export const COR_STATUS: Record<Status, "success" | "neutral"> = {
  ativo: "success",
  inativo: "neutral",
};

export const ROTULO_STATUS: Record<Status, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

export interface Cupom {
  id: string;
  codigo: string;
  desconto: string;
  freteGratis: boolean;
  vigencia: string;
  usos: number;
  limite: string;
  status: Status;
}

export interface Promocao {
  id: string;
  nome: string;
  tipo: string;
  aplicarA: string;
  vigencia: string;
  status: Status;
}

export interface FreteGratis {
  id: string;
  meioEnvio: string;
  precoMinimo: number | null;
  categorias: string;
  zonas: string;
  status: Status;
}

export const CUPONS: Cupom[] = [
  { id: "cp-01", codigo: "BEMVINDA10", desconto: "10%", freteGratis: false, vigencia: "Sem vencimento", usos: 43, limite: "1 por cliente", status: "ativo" },
  { id: "cp-02", codigo: "FRETEGRATIS", desconto: "—", freteGratis: true, vigencia: "01/07 a 31/07", usos: 12, limite: "1 limite", status: "ativo" },
  { id: "cp-03", codigo: "VOLTA20", desconto: "R$ 20,00", freteGratis: false, vigencia: "Expirado em 30/06", usos: 87, limite: "Sem limite", status: "inativo" },
  { id: "cp-04", codigo: "PRIMEIRACOMPRA", desconto: "15%", freteGratis: false, vigencia: "Sem vencimento", usos: 5, limite: "1 por cliente", status: "ativo" },
];

export const PROMOCOES: Promocao[] = [
  { id: "pr-01", nome: "Leve 3 pague 2 — Gloss", tipo: "Leve X pague Y", aplicarA: "Categoria: Maquiagem", vigencia: "01/07 a 31/07", status: "ativo" },
  { id: "pr-02", nome: "20% em Botas", tipo: "Porcentagem", aplicarA: "Categoria: Botas", vigencia: "Sem vencimento", status: "ativo" },
  { id: "pr-03", nome: "Liquidação de inverno", tipo: "Porcentagem", aplicarA: "Todos os produtos", vigencia: "Expirada em 30/06", status: "inativo" },
];

export const FRETES: FreteGratis[] = [
  { id: "fg-01", meioEnvio: "Jadlog .Package", precoMinimo: 299.0, categorias: "Todas", zonas: "Sudeste", status: "ativo" },
  { id: "fg-02", meioEnvio: "Correios PAC", precoMinimo: 399.0, categorias: "Botas, Sapato", zonas: "Todo o Brasil", status: "ativo" },
  { id: "fg-03", meioEnvio: "Retirada na loja", precoMinimo: null, categorias: "Todas", zonas: "São Paulo — capital", status: "inativo" },
];

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
