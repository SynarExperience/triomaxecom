import { NextResponse } from "next/server";
import { consultarPagamento } from "@/lib/mercadopago";

export const runtime = "nodejs";

/** Confere o pagamento pelo id. Usado pela tela do Pix para saber quando o QR
    foi pago, e pela confirmação para não confiar só no que veio do cliente. */
export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get("payment_id");
  if (!paymentId) {
    return NextResponse.json({ erro: "payment_id ausente." }, { status: 400 });
  }

  try {
    return NextResponse.json(await consultarPagamento(paymentId));
  } catch (erro) {
    console.error("[mercadopago status] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível confirmar o pagamento." }, { status: 502 });
  }
}
