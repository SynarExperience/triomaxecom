/**
 * Dados de exemplo do admin.
 *
 * A ESTRUTURA (colunas, status, badges, meios de pagamento e envio) veio do
 * mapeamento do painel real — ver docs/nuvemshop-admin-mapa.md.
 * Os DADOS são fictícios de propósito: os pedidos reais têm nome, CPF e
 * telefone de clientes, que não devem ser versionados.
 */

export type StatusPagamento = "recebido" | "pendente" | "recusado";
export type StatusEnvio = "por-embalar" | "por-enviar" | "enviada" | "entregue";

export const ROTULO_PAGAMENTO: Record<StatusPagamento, string> = {
  recebido: "Recebido",
  pendente: "Pendente",
  recusado: "Recusado",
};

export const ROTULO_ENVIO: Record<StatusEnvio, string> = {
  "por-embalar": "Por embalar",
  "por-enviar": "Por enviar",
  enviada: "Enviada",
  entregue: "Entregue",
};

/** Mapeia status -> aparência do <Tag> do Nimbus, como no painel real. */
export const COR_PAGAMENTO: Record<StatusPagamento, "success" | "warning" | "danger"> = {
  recebido: "success",
  pendente: "warning",
  recusado: "danger",
};

export const COR_ENVIO: Record<StatusEnvio, "success" | "neutral"> = {
  "por-embalar": "neutral",
  "por-enviar": "neutral",
  enviada: "success",
  entregue: "success",
};

export interface ItemPedido {
  nome: string;
  variacao: string;
  sku: string;
  quantidade: number;
  precoUnitario: number;
}

export interface EventoHistorico {
  descricao: string;
  autor?: string;
  data: string;
}

export interface Pedido {
  id: string;
  numero: string;
  data: string;
  hora: string;
  origem: "Mobile" | "Desktop" | "Pedido manual";
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    documento: string;
  };
  entrega: {
    endereco: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  itens: ItemPedido[];
  frete: number;
  transportadora: string;
  prazo: string;
  peso: string;
  pagamento: StatusPagamento;
  meioPagamento: string;
  envio: StatusEnvio;
  historico: EventoHistorico[];
}

export const PEDIDOS: Pedido[] = [
  {
    id: "129",
    numero: "#129",
    data: "16 jun",
    hora: "22:06",
    origem: "Mobile",
    cliente: {
      nome: "Ana Ribeiro",
      email: "ana.ribeiro@exemplo.com",
      telefone: "+55 11 90000-0001",
      documento: "000.000.000-01",
    },
    entrega: {
      endereco: "Rua das Acácias, 120",
      bairro: "Centro",
      cep: "01000-000",
      cidade: "São Paulo",
      estado: "São Paulo",
      pais: "Brasil",
    },
    itens: [
      { nome: "Bota Cano Alto Preta", variacao: "37, Preto", sku: "BT-37-PT", quantidade: 1, precoUnitario: 298.0 },
    ],
    frete: 14.6,
    transportadora: "Jadlog .Package",
    prazo: "5 dias úteis",
    peso: "0.8 kg",
    pagamento: "recusado",
    meioPagamento: "Pagaleve - Pix",
    envio: "por-embalar",
    historico: [
      { descricao: "Pagamento recusado", data: "16 jun 22:10" },
      { descricao: "Está em revisão.", data: "16 jun 22:06" },
    ],
  },
  {
    id: "127",
    numero: "#127",
    data: "16 jun",
    hora: "11:28",
    origem: "Desktop",
    cliente: {
      nome: "Bruno Carvalho",
      email: "bruno.carvalho@exemplo.com",
      telefone: "+55 21 90000-0002",
      documento: "000.000.000-02",
    },
    entrega: {
      endereco: "Av. Atlântica, 850",
      bairro: "Copacabana",
      cep: "22000-000",
      cidade: "Rio de Janeiro",
      estado: "Rio de Janeiro",
      pais: "Brasil",
    },
    itens: [
      { nome: "Sapatilha Clássica Caramelo", variacao: "36, Caramelo", sku: "SP-36-CR", quantidade: 1, precoUnitario: 421.3 },
    ],
    frete: 14.6,
    transportadora: "Jadlog .Package",
    prazo: "5 dias úteis",
    peso: "0.6 kg",
    pagamento: "recusado",
    meioPagamento: "Pagaleve - Pix",
    envio: "por-embalar",
    historico: [{ descricao: "Pagamento recusado", data: "16 jun 11:30" }],
  },
  {
    id: "120",
    numero: "#120",
    data: "6 jun",
    hora: "22:46",
    origem: "Mobile",
    cliente: {
      nome: "Carla Nogueira",
      email: "carla.nogueira@exemplo.com",
      telefone: "+55 31 90000-0003",
      documento: "000.000.000-03",
    },
    entrega: {
      endereco: "Rua dos Ipês, 45",
      bairro: "Savassi",
      cep: "30000-000",
      cidade: "Belo Horizonte",
      estado: "Minas Gerais",
      pais: "Brasil",
    },
    itens: [
      { nome: "Gloss Labial Caramelo", variacao: "Caramelo", sku: "GL-CR-01", quantidade: 2, precoUnitario: 59.2 },
    ],
    frete: 14.61,
    transportadora: "Jadlog .Package (via Melhor Envio)",
    prazo: "4 dias úteis",
    peso: "0.2 kg",
    pagamento: "recebido",
    meioPagamento: "Nuvem Pago - Pix",
    envio: "enviada",
    historico: [
      { descricao: "Pacote #01 enviado", autor: "Luiz", data: "7 jun 09:12" },
      { descricao: "Pacote #01 embalado", autor: "Luiz", data: "7 jun 08:40" },
      { descricao: "Pagamento recebido", data: "6 jun 22:48" },
    ],
  },
  {
    id: "118",
    numero: "#118",
    data: "1 jun",
    hora: "16:45",
    origem: "Desktop",
    cliente: {
      nome: "Diego Prado",
      email: "diego.prado@exemplo.com",
      telefone: "+55 41 90000-0004",
      documento: "000.000.000-04",
    },
    entrega: {
      endereco: "Rua XV de Novembro, 300",
      bairro: "Centro",
      cep: "80000-000",
      cidade: "Curitiba",
      estado: "Paraná",
      pais: "Brasil",
    },
    itens: [
      { nome: "Esponja de Maquiagem Mocha", variacao: "Único", sku: "RE001", quantidade: 3, precoUnitario: 54.13 },
    ],
    frete: 14.62,
    transportadora: "Jadlog .Package (via Melhor Envio)",
    prazo: "6 dias úteis",
    peso: "0.3 kg",
    pagamento: "recebido",
    meioPagamento: "Nuvem Pago - Pix",
    envio: "enviada",
    historico: [
      { descricao: "Pacote #01 enviado", autor: "Luiz", data: "2 jun 10:05" },
      { descricao: "Pagamento recebido", data: "1 jun 16:47" },
    ],
  },
  {
    id: "115",
    numero: "#115",
    data: "27 mai",
    hora: "11:10",
    origem: "Mobile",
    cliente: {
      nome: "Elisa Monteiro",
      email: "elisa.monteiro@exemplo.com",
      telefone: "+55 51 90000-0005",
      documento: "000.000.000-05",
    },
    entrega: {
      endereco: "Av. Ipiranga, 1200",
      bairro: "Azenha",
      cep: "90000-000",
      cidade: "Porto Alegre",
      estado: "Rio Grande do Sul",
      pais: "Brasil",
    },
    itens: [
      { nome: "Sapatilha Bico Fino Dourada", variacao: "35, Dourado", sku: "SP-35-DR", quantidade: 1, precoUnitario: 191.05 },
    ],
    frete: 14.62,
    transportadora: "Jadlog .Package (via Melhor Envio)",
    prazo: "5 dias úteis",
    peso: "0.5 kg",
    pagamento: "recebido",
    meioPagamento: "Nuvem Pago - Pix",
    envio: "entregue",
    historico: [
      { descricao: "Pacote #01 entregue", data: "31 mai 14:20" },
      { descricao: "Pagamento recebido", data: "27 mai 11:12" },
    ],
  },
];

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const totalPedido = (p: Pedido) =>
  p.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0) + p.frete;

export const subtotalPedido = (p: Pedido) =>
  p.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);

export const unidades = (p: Pedido) => p.itens.reduce((s, i) => s + i.quantidade, 0);

/** Contadores dos chips de filtro da lista de vendas. */
export const CONTADORES = [
  { chave: "por-cobrar", rotulo: "Por cobrar", total: 0 },
  { chave: "por-embalar", rotulo: "Por embalar", total: PEDIDOS.filter((p) => p.envio === "por-embalar").length },
  { chave: "por-enviar", rotulo: "Por enviar", total: PEDIDOS.filter((p) => p.envio === "por-enviar").length },
  { chave: "por-retirar", rotulo: "Por retirar", total: 0 },
  { chave: "por-arquivar", rotulo: "Por arquivar", total: 3 },
];
