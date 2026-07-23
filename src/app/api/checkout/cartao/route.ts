import { NextResponse } from "next/server";
import { criarPagamentoCartao, type DadosCartao } from "@/lib/mercadopago";

export const runtime = "nodejs";

/**
 * Cria um pagamento com cartão. Recebe o token (gerado no navegador), o método
 * e as parcelas — nunca o número do cartão, que não passa pelo nosso servidor.
 */
export async function POST(request: Request) {
  let corpo: DadosCartao;
  try {
    corpo = (await request.json()) as DadosCartao;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (!corpo?.token || !corpo?.paymentMethodId || !corpo?.itens?.length || !corpo?.contato?.email) {
    return NextResponse.json({ erro: "Dados do pagamento incompletos." }, { status: 400 });
  }

  try {
    return NextResponse.json(await criarPagamentoCartao(corpo));
  } catch (erro) {
    console.error("[mercadopago cartao] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível processar o cartão. Tente novamente." }, { status: 502 });
  }
}
