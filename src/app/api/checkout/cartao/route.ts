import { NextResponse } from "next/server";
import { contaAtual } from "@/lib/conta";
import { criarPagamentoCartao, type DadosCartao } from "@/lib/mercadopago";

export const runtime = "nodejs";

/**
 * Cria um pagamento com cartão. Recebe o token (gerado no navegador), o método
 * e as parcelas — nunca o número do cartão, que não passa pelo nosso servidor.
 */
export async function POST(request: Request) {
  /* Mesma tranca do Pix: a página do checkout é protegida pelo middleware, mas
     é esta rota que cobra — e ela precisa saber de quem é o pedido pela sessão,
     não pelo que o navegador mandar. */
  const conta = await contaAtual();
  if (!conta) {
    return NextResponse.json({ erro: "Entre na sua conta para finalizar." }, { status: 401 });
  }

  let corpo: DadosCartao;
  try {
    corpo = (await request.json()) as DadosCartao;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (
    !corpo?.token ||
    !corpo?.paymentMethodId ||
    !corpo?.itens?.length ||
    !corpo?.contato?.email ||
    !corpo?.endereco?.cep
  ) {
    return NextResponse.json({ erro: "Dados do pagamento incompletos." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await criarPagamentoCartao(corpo, { userId: conta.userId, clienteId: conta.cliente.id }),
    );
  } catch (erro) {
    console.error("[mercadopago cartao] falha:", erro);
    return NextResponse.json({ erro: "Não foi possível processar o cartão. Tente novamente." }, { status: 502 });
  }
}
