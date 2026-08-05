import type { StatusEnvioPedido, StatusPagamentoPedido } from "@/lib/conta";

/*
 * Como o pedido se apresenta ao cliente.
 *
 * O vocabulário do banco é o da operação ("por-embalar", "recebido") e não serve
 * para quem comprou: ninguém acompanha a própria compra pensando em embalagem.
 * Aqui ele vira o que o cliente entende, com um tom que a tela usa para pintar
 * o selo — sem depender só de cor, que quem não a distingue não lê.
 */

export type TomDoSelo = "ok" | "espera" | "ruim" | "neutro";

export type Selo = { texto: string; tom: TomDoSelo };

const PAGAMENTO: Record<StatusPagamentoPedido, Selo> = {
  pendente: { texto: "Aguardando pagamento", tom: "espera" },
  recebido: { texto: "Pagamento aprovado", tom: "ok" },
  recusado: { texto: "Pagamento recusado", tom: "ruim" },
  estornado: { texto: "Pagamento estornado", tom: "ruim" },
};

const ENVIO: Record<StatusEnvioPedido, Selo> = {
  "por-embalar": { texto: "Em preparação", tom: "neutro" },
  "por-enviar": { texto: "Pronto para envio", tom: "neutro" },
  enviada: { texto: "A caminho", tom: "espera" },
  entregue: { texto: "Entregue", tom: "ok" },
  cancelada: { texto: "Cancelada", tom: "ruim" },
};

export function seloPagamento(status: StatusPagamentoPedido): Selo {
  return PAGAMENTO[status] ?? { texto: status, tom: "neutro" };
}

export function seloEnvio(status: StatusEnvioPedido): Selo {
  return ENVIO[status] ?? { texto: status, tom: "neutro" };
}

/** "Pix" e "Cartão de crédito" — o banco guarda a chave, não o nome. */
export function nomeDoPagamento(meio: string | null): string {
  if (meio === "pix") return "Pix";
  if (meio === "cartao") return "Cartão de crédito";
  return meio ?? "—";
}

/* Fuso fixo porque o servidor roda em UTC: sem ele, uma compra das 21h de
   terça aparece como quarta-feira para quem a fez. */
const DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export const formatarData = (iso: string) => DATA.format(new Date(iso));
export const formatarDataHora = (iso: string) => DATA_HORA.format(new Date(iso));
