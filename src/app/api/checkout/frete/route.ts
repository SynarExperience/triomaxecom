import { NextResponse } from "next/server";
import { calcularFrete, type ItemFrete } from "@/lib/melhorenvio";

export const runtime = "nodejs";

type CorpoFrete = { cep: string; itens: ItemFrete[] };

/** Cota o frete no Melhor Envio para o CEP e os itens do carrinho. */
export async function POST(request: Request) {
  let corpo: CorpoFrete;
  try {
    corpo = (await request.json()) as CorpoFrete;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (!corpo?.cep || !corpo?.itens?.length) {
    return NextResponse.json({ erro: "CEP e itens são obrigatórios." }, { status: 400 });
  }

  try {
    const opcoes = await calcularFrete(corpo.cep, corpo.itens);
    return NextResponse.json({ opcoes });
  } catch (erro) {
    console.error("[melhorenvio frete] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível calcular o frete." }, { status: 502 });
  }
}
