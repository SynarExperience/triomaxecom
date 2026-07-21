/**
 * Dados de exemplo da tela de Clientes.
 *
 * ESTRUTURA tirada do painel real (docs/nuvemshop-admin-mapa.md e o screenshot
 * out/screenshots/admin_customers_0.png): tabela `Nome | Última compra |
 * Total consumido | Contato`, sem checkbox de seleção — diferente de Vendas e
 * Produtos —, com "Última compra" combinando link do pedido + data, e a coluna
 * Contato como dois botões redondos (e-mail e WhatsApp).
 * DADOS são fictícios.
 */

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  /** Ausente quando o cliente nunca comprou — a célula fica vazia no painel. */
  ultimaCompra: { pedido: string; data: string } | null;
  totalConsumido: number;
}

export const CLIENTES: Cliente[] = [
  {
    id: "c-01",
    nome: "Carla Nogueira",
    email: "carla.nogueira@exemplo.com",
    telefone: "+5531900000003",
    documento: "000.000.000-03",
    ultimaCompra: { pedido: "#120", data: "06/06/2024" },
    totalConsumido: 133.01,
  },
  {
    id: "c-02",
    nome: "Débora Castro",
    email: "debora.castro@exemplo.com",
    telefone: "+5511900000006",
    documento: "000.000.000-06",
    ultimaCompra: { pedido: "#126", data: "16/06/2025" },
    totalConsumido: 435.9,
  },
  {
    id: "c-03",
    nome: "Elisa Monteiro",
    email: "elisa.monteiro@exemplo.com",
    telefone: "+5551900000005",
    documento: "000.000.000-05",
    ultimaCompra: { pedido: "#115", data: "27/05/2024" },
    totalConsumido: 205.67,
  },
  {
    id: "c-04",
    nome: "Henrique Salles",
    email: "henrique.salles@exemplo.com",
    telefone: "+5541900000007",
    documento: "000.000.000-07",
    ultimaCompra: { pedido: "#114", data: "03/04/2024" },
    totalConsumido: 249.88,
  },
  {
    id: "c-05",
    nome: "Bruno Carvalho",
    email: "bruno.carvalho@exemplo.com",
    telefone: "+5521900000002",
    documento: "000.000.000-02",
    ultimaCompra: { pedido: "#127", data: "16/06/2025" },
    totalConsumido: 435.9,
  },
  {
    id: "c-06",
    nome: "Ana Ribeiro",
    email: "ana.ribeiro@exemplo.com",
    telefone: "+5511900000001",
    documento: "000.000.000-01",
    ultimaCompra: { pedido: "#129", data: "16/06/2025" },
    totalConsumido: 624.3,
  },
  {
    id: "c-07",
    nome: "Diego Prado",
    email: "diego.prado@exemplo.com",
    telefone: "+5541900000004",
    documento: "000.000.000-04",
    ultimaCompra: { pedido: "#118", data: "01/06/2024" },
    totalConsumido: 177.01,
  },
  {
    id: "c-08",
    nome: "Marta Silveira",
    email: "marta.silveira@exemplo.com",
    telefone: "+5511900000008",
    documento: "000.000.000-08",
    ultimaCompra: { pedido: "#108", data: "13/02/2024" },
    totalConsumido: 4.0,
  },
  {
    // cliente cadastrado que nunca comprou: "Última compra" vazia e total zerado
    id: "c-09",
    nome: "Paula Andrade",
    email: "paula.andrade@exemplo.com",
    telefone: "+5511900000009",
    documento: "000.000.000-09",
    ultimaCompra: null,
    totalConsumido: 0,
  },
];

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** A busca do painel cobre nome, e-mail e CPF. */
export function filtrarClientes(termo: string): Cliente[] {
  const t = termo.trim().toLowerCase();
  if (!t) return CLIENTES;
  return CLIENTES.filter((c) =>
    `${c.nome} ${c.email} ${c.documento}`.toLowerCase().includes(t),
  );
}
