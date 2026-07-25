import { NextResponse } from "next/server";
import { rastrearPorCodigo } from "@/lib/rastreio";

export const runtime = "nodejs";

/** Rastreia um pedido pelo código, para o painel de rastreio do cliente. */
export async function GET(request: Request) {
  const codigo = new URL(request.url).searchParams.get("codigo") ?? "";
  if (!codigo.trim()) {
    return NextResponse.json({ erro: "Informe o código de rastreio." }, { status: 400 });
  }

  try {
    const resultado = await rastrearPorCodigo(codigo);
    if (!resultado) return NextResponse.json({ encontrado: false });
    return NextResponse.json({ encontrado: true, ...resultado });
  } catch (erro) {
    console.error("[rastreio] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível consultar o rastreio." }, { status: 502 });
  }
}
