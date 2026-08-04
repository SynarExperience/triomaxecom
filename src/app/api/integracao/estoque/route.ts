import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
 * Recebe do gerenciador de estoque o aviso de que um produto mudou de saldo.
 *
 * Quem chama é um gatilho no banco do gerenciador (pg_net), disparado sempre
 * que `products.stock` muda — é isso que torna o sincronismo imediato em vez de
 * depender de alguém rodar o script.
 *
 * O corpo é o payload de webhook do Supabase: `record` traz a linha nova.
 *
 * Fail-closed: sem INTEGRACAO_ESTOQUE_SECRET configurado, ninguém entra.
 */

/** O gerenciador identifica o produto por `TMX-` + id com 4 dígitos. */
function codigoDoProduto(id: number): string {
  return `TMX-${String(id).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  const esperado = process.env.INTEGRACAO_ESTOQUE_SECRET;
  const enviado = req.headers.get("x-integracao-secret");

  if (!esperado || enviado !== esperado) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let corpo: { record?: { id?: number; stock?: number | null } };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const id = corpo.record?.id;
  const estoque = corpo.record?.stock;
  if (typeof id !== "number" || typeof estoque !== "number") {
    return NextResponse.json({ erro: "record.id e record.stock são obrigatórios" }, { status: 400 });
  }

  const codigo = codigoDoProduto(id);
  const { data: slug, error } = await supabaseAdmin.rpc("aplicar_estoque_integracao", {
    p_codigo: codigo,
    p_quantidade: estoque,
  });

  if (error) {
    console.error(`[integracao] falha ao aplicar ${codigo}=${estoque}:`, error.message);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  /* Produto do gerenciador que ninguém ligou a um produto do site. Não é erro:
     o catálogo de lá é maior que a vitrine. Responde 200 de propósito — 4xx
     faria o gatilho tentar de novo para sempre por algo que nunca vai mudar. */
  if (!slug) {
    return NextResponse.json({ ignorado: codigo, motivo: "nenhum produto com este ID de integração" });
  }

  /* A vitrine é estática: sem isto o cliente continua vendo o saldo antigo, e o
     sincronismo "em tempo real" só existiria no banco. */
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${slug}`);

  return NextResponse.json({ atualizado: codigo, slug, quantidade: estoque });
}
