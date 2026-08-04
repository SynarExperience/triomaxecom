import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { atualizarEntregaMotoboy } from "@/lib/pedidos";

export const runtime = "nodejs";

/*
 * Webhook da praça de motoboy (Entregas Expressas): avisa a cada mudança no
 * pedido de entrega — entregador aceitou, chegou na loja, coletou, entregou.
 *
 * É o que mantém o rastreio do cliente em dia sem ficar consultando a praça a
 * cada visita à página.
 *
 * Diferente do Mercado Pago, aqui NÃO há assinatura por HMAC: a praça manda um
 * código fixo no header `webhook-security`. É um segredo compartilhado simples,
 * então o corpo da notificação é tratado como dado não confiável e nada além do
 * id/status é aproveitado dele.
 */

const segredo = process.env.MOTOBOY_WEBHOOK_SECRET ?? "";

/** Lojista da loja dentro da praça. Ver a guarda em `POST` para o porquê. */
const clienteId = Number(process.env.MOTOBOY_CLIENTE_ID ?? 0);

/** Compara em tempo constante, sem vazar o tamanho pelo caminho rápido. */
function codigoConfere(recebido: string): boolean {
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Notificacao = {
  event?: string;
  order?: {
    id?: number | string;
    user_id?: number | string;
    order_status?: string;
    tracking_url?: string | null;
  };
};

export async function POST(request: Request) {
  /* Sem segredo configurado o endpoint fica fechado. O contrário — aceitar
     qualquer chamada — deixaria qualquer um mexer no status dos pedidos. */
  if (!segredo) {
    console.error("[webhook motoboy] MOTOBOY_WEBHOOK_SECRET não configurado.");
    return NextResponse.json({ erro: "Webhook não configurado." }, { status: 503 });
  }

  if (!codigoConfere(request.headers.get("webhook-security") ?? "")) {
    return NextResponse.json({ erro: "Código de segurança inválido." }, { status: 401 });
  }

  let corpo: Notificacao;
  try {
    corpo = (await request.json()) as Notificacao;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const pedido = corpo?.order;
  const id = Number(pedido?.id);
  if (!pedido || !Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ignorado: true });
  }

  /* O token é de administrador da praça, então a notificação chega para os
     pedidos de TODOS os lojistas dela — não só os nossos. Descartar aqui evita
     tanto processar dado de terceiro quanto varrer o banco por um pedido que
     nunca vai existir. */
  if (clienteId > 0 && Number(pedido.user_id) !== clienteId) {
    return NextResponse.json({ ignorado: true });
  }

  const status = String(pedido.order_status ?? "");
  const tracking = typeof pedido.tracking_url === "string" ? pedido.tracking_url : null;

  try {
    const encontrado = await atualizarEntregaMotoboy(id, status, tracking);
    if (!encontrado) {
      /* Entrega criada fora da loja (pelo painel da praça, por exemplo) ou aviso
         que chegou antes de o despacho gravar o código. Responder 200 encerra o
         assunto; um erro faria a praça reenviar para sempre. */
      console.warn(`[webhook motoboy] nenhum pedido nosso para a entrega ${id}.`);
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("[webhook motoboy] falha ao processar:", erro);
    return NextResponse.json({ erro: "Falha ao processar." }, { status: 500 });
  }
}
