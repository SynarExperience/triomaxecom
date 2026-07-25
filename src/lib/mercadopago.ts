import "server-only";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { listarProdutos } from "@/lib/produtos";
import { digitos } from "@/lib/checkout";
import { criarPedido, statusDoMercadoPago } from "@/lib/pedidos";
import type { DadosEntrega, Endereco, OpcaoFrete } from "@/types/checkout";

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
  /** Resolvido pelo CEP; vai para o endereço de entrega do pedido. */
  endereco: Endereco;
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
  /** Número do pedido gravado no banco; `null` se a gravação falhou. */
  numeroPedido: number | null;
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

  // Sempre prefixado com "Site Triomax": é o texto que aparece na Atividade do
  // Mercado Pago, e o pedido de 1 item não pode sair sem identificar a loja.
  const itensTexto = linhas.length === 1
    ? `${linhas[0].quantidade}x ${linhas[0].produto.name}`
    : `${linhas.reduce((n, l) => n + l.quantidade, 0)} itens`;
  const descricao = `Site Triomax • ${itensTexto}`;

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

  return { total, subtotal, descricao, payer, linhas };
}

type PedidoMontado = Awaited<ReturnType<typeof montarPedido>>;

/** Chave de idempotência por tentativa: se o request for repetido (rede,
    duplo-clique), o Mercado Pago não cria dois pagamentos. */
function chaveIdempotencia(prefixo: string) {
  return `${prefixo}-${globalThis.crypto.randomUUID()}`;
}

/* Quando definida, o Mercado Pago avisa esta URL a cada mudança de status —
   evita depender só do que estiver configurado no painel deles. */
const notificationUrl = process.env.MERCADOPAGO_NOTIFICATION_URL;

/**
 * Grava o pedido depois que o pagamento existe, guardando o id do pagamento
 * para o webhook reencontrá-lo. Nunca lança: o dinheiro já foi movimentado e
 * uma falha de gravação não pode derrubar o checkout do cliente.
 */
async function gravarPedido(
  dados: DadosBase,
  montado: PedidoMontado,
  pagamentoId: number,
  status: string,
  meioPagamento: "pix" | "cartao",
): Promise<number | null> {
  const pedido = await criarPedido({
    itens: montado.linhas.map((linha) => ({
      nome: linha.produto.name,
      sku: linha.produto.slug,
      quantidade: linha.quantidade,
      precoUnitario: linha.produto.price,
    })),
    subtotal: montado.subtotal,
    total: montado.total,
    frete: dados.frete,
    contato: dados.contato,
    entrega: dados.entrega,
    endereco: dados.endereco,
    meioPagamento,
    pagamentoId: String(pagamentoId),
    statusPagamento: statusDoMercadoPago(status),
  });
  return pedido?.numero ?? null;
}

/** Cria um pagamento Pix. Volta `pending` com o QR; o dinheiro só se move
    quando o cliente paga o QR. */
export async function criarPagamentoPix(dados: DadosPix): Promise<ResultadoPagamento> {
  const montado = await montarPedido(dados);
  const { total, descricao, payer } = montado;
  const payment = new Payment(client);

  const resultado = await payment.create({
    body: {
      transaction_amount: total,
      description: descricao,
      // Aparece na fatura do cliente (relevante no cartão; ignorado no Pix).
      statement_descriptor: "SITE TRIOMAX",
      payment_method_id: "pix",
      payer,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
    requestOptions: { idempotencyKey: chaveIdempotencia("pix") },
  });

  /* Nasce `pending`: o Pix só vira `recebido` quando o cliente paga o QR, e
     quem faz essa virada é o webhook. */
  const numeroPedido = await gravarPedido(
    dados,
    montado,
    resultado.id!,
    resultado.status ?? "pending",
    "pix",
  );

  const transacao = resultado.point_of_interaction?.transaction_data;
  return {
    id: resultado.id!,
    status: resultado.status ?? "desconhecido",
    statusDetail: resultado.status_detail ?? "",
    total,
    numeroPedido,
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
  const montado = await montarPedido(dados);
  const { total, descricao, payer } = montado;
  const payment = new Payment(client);

  const resultado = await payment.create({
    body: {
      transaction_amount: total,
      token: dados.token,
      description: descricao,
      statement_descriptor: "SITE TRIOMAX",
      installments: Math.max(1, Math.min(12, Math.trunc(dados.parcelas))),
      payment_method_id: dados.paymentMethodId,
      // O SDK tipa issuer_id como número; o cliente manda string.
      issuer_id: dados.issuerId ? Number(dados.issuerId) : undefined,
      payer,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
    requestOptions: { idempotencyKey: chaveIdempotencia("card") },
  });

  /* No cartão o status já vem resolvido (approved/rejected), mas o webhook
     ainda cobre estorno e análise antifraude que terminam depois. */
  const numeroPedido = await gravarPedido(
    dados,
    montado,
    resultado.id!,
    resultado.status ?? "pending",
    "cartao",
  );

  return {
    id: resultado.id!,
    status: resultado.status ?? "desconhecido",
    statusDetail: resultado.status_detail ?? "",
    total,
    numeroPedido,
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
