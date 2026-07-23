import "server-only";
import { listarProdutos } from "@/lib/produtos";
import { digitos, FRETE_GRATIS_A_PARTIR_DE } from "@/lib/checkout";
import type { OpcaoFrete } from "@/types/checkout";

/*
 * Cotação de frete pelo Melhor Envio. A chamada roda aqui, no servidor, com o
 * token pessoal — igual ao Access Token do Mercado Pago, ele nunca chega ao
 * navegador. O `server-only` derruba o build se este módulo for importado num
 * componente client.
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

const caixaPadrao = {
  weight: Number(process.env.MELHORENVIO_BOX_WEIGHT ?? 1),
  height: Number(process.env.MELHORENVIO_BOX_HEIGHT ?? 20),
  width: Number(process.env.MELHORENVIO_BOX_WIDTH ?? 20),
  length: Number(process.env.MELHORENVIO_BOX_LENGTH ?? 20),
};

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

  const produtos = itens
    .map(({ slug, quantidade }) => {
      const produto = porSlug.get(slug);
      if (!produto) return null;
      const qtd = Math.max(1, Math.min(9, Math.trunc(quantidade)));
      return {
        id: produto.slug,
        width: caixaPadrao.width,
        height: caixaPadrao.height,
        length: caixaPadrao.length,
        weight: caixaPadrao.weight,
        insurance_value: produto.price,
        quantity: qtd,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (produtos.length === 0) throw new Error("Nenhum item válido no carrinho.");

  const subtotal = produtos.reduce((s, p) => s + p.insurance_value * p.quantity, 0);

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
      products: produtos,
    }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Melhor Envio respondeu ${resposta.status}: ${texto.slice(0, 300)}`);
  }

  const dados = (await resposta.json()) as ServicoME[];

  const opcoes = dados
    .filter((s) => !s.error && s.price != null)
    .map<OpcaoFrete>((s) => ({
      id: String(s.id),
      transportadora: s.company?.name ?? "Transportadora",
      servico: s.name,
      preco: Number(s.custom_price ?? s.price),
      prazoDias: Number(s.custom_delivery_time ?? s.delivery_time ?? 0),
    }))
    .sort((a, b) => a.preco - b.preco);

  // Mesma régua da sacola: acima do piso, a opção mais barata sai de graça (a
  // loja absorve o custo). Mantém a promessa de frete grátis já anunciada.
  if (subtotal >= FRETE_GRATIS_A_PARTIR_DE && opcoes.length > 0) {
    opcoes[0] = { ...opcoes[0], preco: 0 };
  }

  return opcoes;
}
