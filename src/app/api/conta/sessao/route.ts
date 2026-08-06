import { NextResponse } from "next/server";
import { contaAtual } from "@/lib/conta";

export const runtime = "nodejs";
/* Depende do cookie de sessão: cachear entregaria o nome de um cliente a
   outro. */
export const dynamic = "force-dynamic";

/**
 * Diz ao cabeçalho se há alguém logado, e como chamá-lo.
 *
 * Existe para o menu da conta poder mudar de cara sem tornar a página
 * dinâmica: ler a sessão dentro do cabeçalho arrastaria TODAS as páginas para
 * renderização sob demanda — inclusive as de produto, que hoje são estáticas.
 * Assim o HTML continua igual para todo mundo e só esta chamada, feita depois
 * no navegador, carrega o que é pessoal.
 *
 * Devolve só o primeiro nome. O menu não precisa de mais nada, e o resto do
 * cadastro não tem por que trafegar.
 */
export async function GET() {
  const conta = await contaAtual();
  if (!conta) return NextResponse.json({ logado: false });

  return NextResponse.json({
    logado: true,
    nome: conta.cliente.nome.trim().split(/\s+/)[0] ?? "",
  });
}
