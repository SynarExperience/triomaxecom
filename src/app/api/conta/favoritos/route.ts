import { NextResponse } from "next/server";
import { contaAtual, idsFavoritos } from "@/lib/conta";

export const runtime = "nodejs";
/* Depende do cookie de sessão: nunca pode ser cacheada, senão a lista de um
   cliente apareceria para outro. */
export const dynamic = "force-dynamic";

/**
 * Ids dos produtos favoritados pelo visitante logado.
 *
 * Existe para os corações do catálogo saberem seu estado sem tornar a página
 * dinâmica: a listagem e a página de produto continuam estáticas, e só esta
 * chamada — feita depois, no navegador — carrega o que é pessoal.
 *
 * Visitante sem conta recebe lista vazia, e não 401: para a vitrine "ninguém
 * favoritou" e "não está logado" levam ao mesmo coração vazio.
 */
export async function GET() {
  const conta = await contaAtual();
  if (!conta) return NextResponse.json({ ids: [] });

  return NextResponse.json({ ids: await idsFavoritos(conta.cliente.id) });
}
