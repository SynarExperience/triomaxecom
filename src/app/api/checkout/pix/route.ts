import { NextResponse } from "next/server";
import { contaAtual } from "@/lib/conta";
import { criarPagamentoPix, type DadosPix } from "@/lib/mercadopago";

export const runtime = "nodejs";

/** Cria um pagamento Pix e devolve o QR para a nossa tela exibir. */
export async function POST(request: Request) {
  /* A loja exige login para fechar pedido, e a checagem é aqui: o middleware
     protege a PÁGINA do checkout, mas quem cria pagamento é esta rota, e ela
     responde a qualquer request. O dono sai da sessão, nunca do corpo. */
  const conta = await contaAtual();
  if (!conta) {
    return NextResponse.json({ erro: "Entre na sua conta para finalizar." }, { status: 401 });
  }

  let corpo: DadosPix;
  try {
    corpo = (await request.json()) as DadosPix;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (!corpo?.itens?.length || !corpo?.contato?.email || !corpo?.frete || !corpo?.endereco?.cep) {
    return NextResponse.json({ erro: "Dados do pedido incompletos." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await criarPagamentoPix(corpo, { userId: conta.userId, clienteId: conta.cliente.id }),
    );
  } catch (erro) {
    console.error("[mercadopago pix] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível gerar o Pix. Tente novamente." }, { status: 502 });
  }
}
