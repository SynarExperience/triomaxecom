import "server-only";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { listarProdutos } from "@/lib/produtos";
import { digitos } from "@/lib/checkout";
import type { DadosEntrega, OpcaoFrete } from "@/types/checkout";

/*
 * Checkout Transparente do Mercado Pago: o pagamento é criado aqui, no
 * servidor, via API de Pagamentos. O cartão nunca chega aqui em texto — o
 * navegador tokeniza com a Public Key e só o token trafega.
 *
 * O `server-only` derruba o build se este módulo for importado num componente
 * client, protegendo o Access Token.
 */

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN precisa estar definida.");
}

const client = new MercadoPagoConfig({ accessToken });

/** O que o cliente envia do carrinho: o preço NUNCA vem daqui. */
export type ItemCarrinho = { slug: string; quantidade: number };

type DadosBase = {
  itens: ItemCarrinho[];
  frete: OpcaoFrete;
  contato: { email: string };
  entrega: DadosEntrega;
};

export type DadosPix = DadosBase;

export type DadosCartao = DadosBase & {
  token: string;
  /** Bandeira resolvida no cliente (`master`, `visa`, ...). */
  paymentMethodId: string;
  issuerId?: string;
  parcelas: number;
};

export type ResultadoPagamento = {
  id: number;
  status: string;
  statusDetail: string;
  total: number;
  /** Só no Pix: dados para exibir o QR na nossa tela. */
  pix?: {
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl: string;
  };
};

/**
 * Relê o carrinho pelo slug e devolve itens, total e dados do pagador. O valor
 * cobrado é sempre o do catálogo — o que o cliente manda é ignorado, senão
 * bastaria adulterar o request para pagar centavos.
 */
async function montarPedido(dados: DadosBase) {
  const catalogo = await listarProdutos();
  const porSlug = new Map(catalogo.map((produto) => [produto.slug, produto]));

  const linhas = dados.itens
    .map(({ slug, quantidade }) => {
      const produto = porSlug.get(slug);
      if (!produto) return null;
      const qtd = Math.max(1, Math.min(9, Math.trunc(quantidade)));
      return { produto, quantidade: qtd };
    })
    .filter((linha): linha is NonNullable<typeof linha> => linha !== null);

  if (linhas.length === 0) throw new Error("Nenhum item válido no carrinho.");

  const subtotal = linhas.reduce((soma, l) => soma + l.produto.price * l.quantidade, 0);
  // Centavos redondos: o Mercado Pago rejeita transaction_amount com dízima.
  const total = Math.round((subtotal + dados.frete.preco) * 100) / 100;

  const descricao = linhas.length === 1
    ? `${linhas[0].quantidade}x ${linhas[0].produto.name}`
    : `Pedido Triomax — ${linhas.reduce((n, l) => n + l.quantidade, 0)} itens`;

  const documento = digitos(dados.entrega.documento);
  const payer = {
    email: dados.contato.email,
    first_name: dados.entrega.nome,
    last_name: dados.entrega.sobrenome,
    identification: {
      type: documento.length > 11 ? "CNPJ" : "CPF",
      number: documento,
    },
  };

  return { total, descricao, payer };
}

/** Chave de idempotência por tentativa: se o request for repetido (rede,
    duplo-clique), o Mercado Pago não cria dois pagamentos. */
function chaveIdempotencia(prefixo: string) {
  return `${prefixo}-${globalThis.crypto.randomUUID()}`;
}

/** Cria um pagamento Pix. Volta `pending` com o QR; o dinheiro só se move
    quando o cliente paga o QR. */
export async function criarPagamentoPix(dados: DadosPix): Promise<ResultadoPagamento> {
  const { total, descricao, payer } = await montarPedido(dados);
  const payment = new Payment(client);

  const resultado = await payment.create({
    body: {
      transaction_amount: total,
      description: descricao,
      payment_method_id: "pix",
      payer,
    },
    requestOptions: { idempotencyKey: chaveIdempotencia("pix") },
  });

  const transacao = resultado.point_of_interaction?.transaction_data;
  return {
    id: resultado.id!,
    status: resultado.status ?? "desconhecido",
    statusDetail: resultado.status_detail ?? "",
    total,
    pix: {
      qrCode: transacao?.qr_code ?? "",
      qrCodeBase64: transacao?.qr_code_base64 ?? "",
      ticketUrl: transacao?.ticket_url ?? "",
    },
  };
}

/** Cria um pagamento com cartão de crédito, já com o número de parcelas. Os
    juros, quando houver, são os do próprio Mercado Pago — o `transaction_amount`
    é o total à vista e o parcelamento é aplicado por ele. */
export async function criarPagamentoCartao(dados: DadosCartao): Promise<ResultadoPagamento> {
  const { total, descricao, payer } = await montarPedido(dados);
  const payment = new Payment(client);

  const resultado = await payment.create({
    body: {
      transaction_amount: total,
      token: dados.token,
      description: descricao,
      installments: Math.max(1, Math.min(12, Math.trunc(dados.parcelas))),
      payment_method_id: dados.paymentMethodId,
      // O SDK tipa issuer_id como número; o cliente manda string.
      issuer_id: dados.issuerId ? Number(dados.issuerId) : undefined,
      payer,
    },
    requestOptions: { idempotencyKey: chaveIdempotencia("card") },
  });

  return {
    id: resultado.id!,
    status: resultado.status ?? "desconhecido",
    statusDetail: resultado.status_detail ?? "",
    total,
  };
}

export type StatusPagamento = {
  status: string;
  statusDetail: string;
  metodo: string | null;
  valor: number | null;
};

/** Confere um pagamento pelo id — fonte da verdade para a tela de retorno. */
export async function consultarPagamento(paymentId: string): Promise<StatusPagamento> {
  const payment = new Payment(client);
  const resultado = await payment.get({ id: paymentId });
  return {
    status: resultado.status ?? "desconhecido",
    statusDetail: resultado.status_detail ?? "",
    metodo: resultado.payment_method_id ?? null,
    valor: resultado.transaction_amount ?? null,
  };
}
