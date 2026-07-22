/** Contratos do checkout. O fluxo espelha o da Voolt3D (contato → entrega →
    pagamento), adaptado ao catálogo e ao visual da Triomax — ver
    `docs/research/voolt3d.com.br/CHECKOUT-FLOW.md`. */

/** Passo visível no indicador do topo. `carrinho` já vem concluído ao entrar. */
export type CheckoutStep = "carrinho" | "entrega" | "pagamento";

/** Endereço resolvido a partir do CEP. Rua/bairro/cidade vêm da consulta; só
    número e complemento são digitados. */
export type Endereco = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type OpcaoFrete = {
  id: string;
  transportadora: string;
  servico: string;
  /** Em reais. Zero significa frete grátis e é exibido como tal. */
  preco: number;
  prazoDias: number;
};

export type FormaPagamento = "pix" | "cartao" | "boleto";

export type DadosContato = {
  email: string;
  novidades: boolean;
};

export type DadosEntrega = {
  nome: string;
  sobrenome: string;
  telefone: string;
  numero: string;
  semNumero: boolean;
  complemento: string;
  /** CPF ou CNPJ, só dígitos. Obrigatório para a nota fiscal. */
  documento: string;
};

/** Pedido fechado, guardado para a tela de confirmação. Preços são congelados
    no momento da compra: se o catálogo mudar, a confirmação não muda junto. */
export type PedidoConfirmado = {
  numero: string;
  email: string;
  itens: { nome: string; quantidade: number; total: number }[];
  subtotal: number;
  frete: OpcaoFrete;
  total: number;
  pagamento: FormaPagamento;
  endereco: Endereco;
  entrega: DadosEntrega;
};
