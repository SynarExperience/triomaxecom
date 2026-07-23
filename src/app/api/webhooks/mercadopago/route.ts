import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { consultarPagamento } from "@/lib/mercadopago";
import { atualizarPagamento, statusDoMercadoPago } from "@/lib/pedidos";

export const runtime = "nodejs";

/*
 * Webhook do Mercado Pago: avisa quando um pagamento muda de status — é assim
 * que o Pix sai de `pendente` e vira `recebido` sem o cliente fazer nada.
 *
 * A notificação NÃO é fonte da verdade: ela só diz "o pagamento X mudou". O
 * status real é buscado na API do Mercado Pago, então mesmo um aviso forjado
 * não consegue marcar um pedido como pago.
 */

const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;

/**
 * Confere a assinatura `x-signature`. O manifesto é montado no formato exigido
 * pelo Mercado Pago e comparado em tempo constante.
 */
function assinaturaValida(request: Request, dataId: string): boolean {
  // Sem segredo configurado não há o que conferir; a consulta à API adiante
  // continua garantindo que o status é real.
  if (!segredo) return true;

  const assinatura = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id") ?? "";
  if (!assinatura) return false;

  const partes = Object.fromEntries(
    assinatura.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]),
  );
  const ts = partes.ts;
  const recebido = partes.v1;
  if (!ts || !recebido) return false;

  const manifesto = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");

  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(recebido, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let corpo: { type?: string; action?: string; data?: { id?: string | number } };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const tipo = corpo?.type ?? corpo?.action ?? "";
  const dataId = String(corpo?.data?.id ?? "");

  // Só pagamento interessa; os outros avisos (merchant_order etc.) são ignorados.
  if (!tipo.includes("payment") || !dataId) {
    return NextResponse.json({ ignorado: true });
  }

  if (!assinaturaValida(request, dataId)) {
    console.warn("[webhook mp] assinatura inválida para o pagamento", dataId);
    return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  try {
    // Fonte da verdade: o status vem da API, não do corpo da notificação.
    const pagamento = await consultarPagamento(dataId);
    const status = statusDoMercadoPago(pagamento.status);
    const encontrado = await atualizarPagamento(dataId, status);

    if (!encontrado) {
      /* Pode ser um pagamento criado antes desta integração, ou a notificação
         chegou antes de o pedido ser gravado. Responder 200 evita reenvio
         infinito do Mercado Pago. */
      console.warn("[webhook mp] nenhum pedido para o pagamento", dataId);
    }

    return NextResponse.json({ ok: true, status });
  } catch (erro) {
    console.error("[webhook mp] falha ao processar:", erro);
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    return NextResponse.json({ erro: "Falha ao processar." }, { status: 500 });
  }
}
