import { NextResponse } from "next/server";
import { criarPagamentoPix, type DadosPix } from "@/lib/mercadopago";

export const runtime = "nodejs";

/** Cria um pagamento Pix e devolve o QR para a nossa tela exibir. */
export async function POST(request: Request) {
  let corpo: DadosPix;
  try {
    corpo = (await request.json()) as DadosPix;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (!corpo?.itens?.length || !corpo?.contato?.email || !corpo?.frete) {
    return NextResponse.json({ erro: "Dados do pedido incompletos." }, { status: 400 });
  }

  try {
    return NextResponse.json(await criarPagamentoPix(corpo));
  } catch (erro) {
    console.error("[mercadopago pix] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível gerar o Pix. Tente novamente." }, { status: 502 });
  }
}
