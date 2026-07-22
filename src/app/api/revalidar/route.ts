import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/*
 * O painel chama esta rota depois de salvar algo, para a vitrine refletir a
 * mudança sem esperar um novo deploy. São dois projetos separados, então o
 * único vínculo é este segredo compartilhado.
 *
 * Fail-closed: sem REVALIDATE_SECRET configurado, ninguém revalida.
 */
export async function POST(req: NextRequest) {
  const esperado = process.env.REVALIDATE_SECRET;
  const enviado = req.headers.get("x-revalidate-secret");

  if (!esperado || enviado !== esperado) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let caminhos: string[] = [];
  try {
    const corpo = await req.json();
    if (Array.isArray(corpo?.caminhos)) caminhos = corpo.caminhos;
  } catch {
    /* corpo vazio: revalida o padrão abaixo */
  }

  /* Sem lista explícita, revalida o que depende do catálogo e do conteúdo. */
  if (caminhos.length === 0) caminhos = ["/", "/produtos"];

  caminhos.forEach((c) => revalidatePath(c));

  return NextResponse.json({ revalidado: caminhos });
}
