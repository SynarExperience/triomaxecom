import "server-only";
import { listarProdutos } from "@/lib/produtos";
import { cotarMotoboy } from "@/lib/motoboy";
import { digitos } from "@/lib/checkout";
import type { OpcaoFrete } from "@/types/checkout";

/*
 * Cotação de frete pelo Melhor Envio. A chamada roda aqui, no servidor, com o
 * token pessoal — igual ao Access Token do Mercado Pago, ele nunca chega ao
 * navegador. O `server-only` derruba o build se este módulo for importado num
 * componente client.
 *
 * `calcularFrete` monta a lista inteira de entrega, não só o que vem do Melhor
 * Envio: a retirada no balcão e o motoboy (`lib/motoboy.ts`) entram aqui porque
 * é este o ponto onde o carrinho já está relido e pesado.
 *
 * O catálogo não guarda peso nem dimensões, então usamos uma caixa padrão
 * (MELHORENVIO_BOX_*) para todos os itens. O valor declarado (insurance_value)
 * é o preço do próprio produto.
 */

const token = process.env.MELHORENVIO_TOKEN;
if (!token) {
  throw new Error("MELHORENVIO_TOKEN precisa estar definida.");
}

// Produção por padrão; MELHORENVIO_SANDBOX=true aponta para o ambiente de teste.
const sandbox = process.env.MELHORENVIO_SANDBOX === "true";
const BASE = sandbox
  ? "https://sandbox.melhorenvio.com.br"
  : "https://www.melhorenvio.com.br";

const cepOrigem = digitos(process.env.MELHORENVIO_FROM_CEP ?? "");
// O Melhor Envio exige um contato no User-Agent para identificar a integração.
const contatoUA = process.env.MELHORENVIO_USER_AGENT_EMAIL ?? "contato@triomax.com.br";

const caixa = {
  height: Number(process.env.MELHORENVIO_BOX_HEIGHT ?? 20),
  width: Number(process.env.MELHORENVIO_BOX_WIDTH ?? 20),
  length: Number(process.env.MELHORENVIO_BOX_LENGTH ?? 20),
  /** Quantos produtos cabem em uma caixa. */
  capacidade: Math.max(1, Number(process.env.MELHORENVIO_CAIXA_CAPACIDADE ?? 3)),
};

/** Peso de um produto, em kg — o catálogo não guarda peso. (Aceita o nome
    antigo MELHORENVIO_BOX_WEIGHT por compatibilidade.) */
const pesoProduto = Number(
  process.env.MELHORENVIO_PESO_PRODUTO ?? process.env.MELHORENVIO_BOX_WEIGHT ?? 1,
);

/**
 * Divide os produtos em caixas: cada uma leva até `capacidade` produtos e pesa
 * (produtos nela × peso do produto). Ex.: 7 produtos, capacidade 3 → caixas de
 * 3, 3 e 1. É por isso que 6 itens viram 2 caixas, e não 6 volumes soltos.
 */
function montarVolumes(totalProdutos: number) {
  const numCaixas = Math.max(1, Math.ceil(totalProdutos / caixa.capacidade));
  const volumes: { height: number; width: number; length: number; weight: number }[] = [];
  let restante = totalProdutos;
  for (let i = 0; i < numCaixas; i += 1) {
    const naCaixa = Math.min(caixa.capacidade, restante);
    restante -= naCaixa;
    volumes.push({
      height: caixa.height,
      width: caixa.width,
      length: caixa.length,
      weight: Number((naCaixa * pesoProduto).toFixed(2)),
    });
  }
  return volumes;
}

/** O que o cliente envia do carrinho: o preço/medidas NUNCA vêm daqui. */
export type ItemFrete = { slug: string; quantidade: number };

/** Subset da resposta de `/shipment/calculate` que usamos. Serviços sem preço
    vêm com `error` (rota indisponível, dimensão fora do limite etc.). */
type ServicoME = {
  id: number;
  name: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { id: number; name: string };
  error?: string;
};

/**
 * Relê o carrinho pelo slug, monta os pacotes e pede as opções de frete ao
 * Melhor Envio. Devolve as opções da mais barata para a mais cara.
 */
export async function calcularFrete(
  cepDestino: string,
  itens: ItemFrete[],
): Promise<OpcaoFrete[]> {
  const destino = digitos(cepDestino);
  if (destino.length !== 8) throw new Error("CEP de destino inválido.");
  if (cepOrigem.length !== 8) {
    throw new Error("MELHORENVIO_FROM_CEP (CEP de origem) precisa estar definida.");
  }

  const catalogo = await listarProdutos();
  const porSlug = new Map(catalogo.map((produto) => [produto.slug, produto]));

  const linhas = itens
    .map(({ slug, quantidade }) => {
      const produto = porSlug.get(slug);
      if (!produto) return null;
      const qtd = Math.max(1, Math.min(9, Math.trunc(quantidade)));
      return { produto, qtd };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (linhas.length === 0) throw new Error("Nenhum item válido no carrinho.");

  const totalProdutos = linhas.reduce((s, l) => s + l.qtd, 0);
  const subtotal = linhas.reduce((s, l) => s + l.produto.price * l.qtd, 0);
  const volumes = montarVolumes(totalProdutos);

  /* Motoboy e Melhor Envio são serviços independentes: disparar antes e aguardar
     no fim faz as duas latências correrem juntas, em vez de somadas na espera do
     cliente. `cotarMotoboy` já engole os próprios erros; o `catch` aqui é só
     para uma falha dele nunca derrubar a cotação inteira. */
  const motoboy = cotarMotoboy(destino, totalProdutos * pesoProduto).catch(() => null);

  const resposta = await fetch(`${BASE}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `Triomax (${contatoUA})`,
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to: { postal_code: destino },
      volumes,
      options: { insurance_value: Number(subtotal.toFixed(2)) },
    }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Melhor Envio respondeu ${resposta.status}: ${texto.slice(0, 300)}`);
  }

  const dados = (await resposta.json()) as ServicoME[];

  const opcoes = dados
    .filter((s) => !s.error && s.price != null && transportadoraPermitida(s))
    .map<OpcaoFrete>((s) => ({
      id: String(s.id),
      transportadora: s.company?.name ?? "Transportadora",
      servico: s.name,
      preco: Number(s.custom_price ?? s.price),
      prazoDias: Number(s.custom_delivery_time ?? s.delivery_time ?? 0),
    }))
    .sort((a, b) => a.preco - b.preco);

  // Toda opção de entrega é cobrada pelo preço cotado — a loja não absorve mais
  // o frete acima de um piso. A única linha sem custo é a retirada no balcão,
  // que é grátis por não haver envio, e não por promoção.
  //
  // Retirada na loja: sempre disponível e grátis, no topo da lista. O motoboy
  // vem logo abaixo, fora da ordenação por preço: ele quase nunca é o mais
  // barato, mas é o único que entrega hoje, e enterrá-lo no fim da lista
  // esconderia justamente o que ele tem de diferente. `null` quando o CEP está
  // fora de área — aí a lista fica como era antes.
  const expresso = await motoboy;
  return [retirarNaLoja(), ...(expresso ? [expresso] : []), ...opcoes];
}

/** Só Correios PAC/SEDEX e a Jadlog .Package entram na lista do cliente
    (fora as demais variantes da Jadlog: .Com, .Package Centralizado etc.). */
function transportadoraPermitida(s: ServicoME): boolean {
  const empresa = (s.company?.name ?? "").toLowerCase();
  const servico = (s.name ?? "").trim().toLowerCase();
  if (empresa.includes("jadlog")) return servico === ".package";
  if (empresa.includes("correios") && (servico.includes("pac") || servico.includes("sedex"))) {
    return true;
  }
  return false;
}

/** Opção de retirar no balcão da loja — sem entrega, sem custo. */
function retirarNaLoja(): OpcaoFrete {
  return {
    id: "retirada",
    transportadora: "Retirada na loja",
    servico: process.env.MELHORENVIO_FROM_CITY ?? "Camboriú/SC",
    preco: 0,
    prazoDias: 1,
    retirada: true,
  };
}

/** Ciclo de vida de um envio, como o Melhor Envio devolve no rastreio. */
export type RastreioMelhorEnvio = {
  status: string;
  tracking: string | null;
  melhorenvioTracking: string | null;
  createdAt: string | null;
  paidAt: string | null;
  generatedAt: string | null;
  postedAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
};

/**
 * Rastreia um envio pelo id do Melhor Envio (o `melhorenvio_order_id` gravado
 * ao emitir a etiqueta). Devolve o ciclo de vida, ou `null` se o id não existe.
 */
export async function rastrearMelhorEnvio(orderId: string): Promise<RastreioMelhorEnvio | null> {
  const resposta = await fetch(`${BASE}/api/v2/me/shipment/tracking`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `Triomax (${contatoUA})`,
    },
    body: JSON.stringify({ orders: [orderId] }),
  });

  if (!resposta.ok) return null;

  const dados = (await resposta.json()) as Record<string, Record<string, unknown>>;
  const info = dados[orderId];
  if (!info || typeof info !== "object") return null;

  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    status: str(info.status) ?? "pending",
    tracking: str(info.tracking),
    melhorenvioTracking: str(info.melhorenvio_tracking),
    createdAt: str(info.created_at),
    paidAt: str(info.paid_at),
    generatedAt: str(info.generated_at),
    postedAt: str(info.posted_at),
    deliveredAt: str(info.delivered_at),
    canceledAt: str(info.canceled_at),
  };
}
