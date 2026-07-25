import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rastrearMelhorEnvio } from "@/lib/melhorenvio";

/*
 * Rastreio voltado ao cliente: ele cola o código, achamos o pedido no banco
 * (pelo código gravado ao emitir a etiqueta) e devolvemos o ciclo de vida do
 * envio vindo do Melhor Envio, montado como uma linha do tempo.
 *
 * O Melhor Envio não expõe os eventos cidade-a-cidade por esta rota; para isso,
 * o link `urlCompleto` leva ao rastreio detalhado. Um agregador (LogAPI) pode
 * substituir esta fonte no futuro sem mudar a tela.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-07-21 17:12:21" -> "21 jul, 17:12". */
function formatar(iso: string | null): string | null {
  if (!iso) return null;
  const [dia, hora] = iso.split(" ");
  const partes = dia.split("-");
  if (partes.length !== 3) return null;
  const hhmm = (hora ?? "").slice(0, 5);
  return `${Number(partes[2])} ${MESES[Number(partes[1]) - 1]}${hhmm ? `, ${hhmm}` : ""}`;
}

export type EtapaRastreio = {
  titulo: string;
  data: string | null;
  concluida: boolean;
};

export type RastreioPedido = {
  numero: number;
  codigo: string;
  transportadora: string;
  status: string;
  entregue: boolean;
  cancelado: boolean;
  etapas: EtapaRastreio[];
  urlCompleto: string;
};

export async function rastrearPorCodigo(codigoBruto: string): Promise<RastreioPedido | null> {
  const codigo = (codigoBruto ?? "").trim().toUpperCase();
  // Só letras e números: além de ser o formato dos códigos, evita injeção no
  // filtro `.or()` do PostgREST logo abaixo.
  if (!/^[A-Z0-9]{6,}$/.test(codigo)) return null;

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("numero, transportadora, melhorenvio_order_id, rastreio, codigo_rastreio")
    .or(`rastreio.eq.${codigo},codigo_rastreio.eq.${codigo}`)
    .maybeSingle();

  if (error || !data?.melhorenvio_order_id) return null;

  const r = await rastrearMelhorEnvio(data.melhorenvio_order_id as string);
  if (!r) return null;

  const codigoReal = r.tracking ?? r.melhorenvioTracking ?? codigo;
  const cancelado = Boolean(r.canceledAt);
  const entregue = r.status === "delivered";

  const etapas: EtapaRastreio[] = [
    { titulo: "Pedido confirmado", data: formatar(r.createdAt), concluida: Boolean(r.createdAt) },
    { titulo: "Preparando o envio", data: formatar(r.generatedAt), concluida: Boolean(r.generatedAt) },
    { titulo: "A caminho", data: formatar(r.postedAt), concluida: Boolean(r.postedAt) },
    { titulo: "Entregue", data: formatar(r.deliveredAt), concluida: Boolean(r.deliveredAt) },
  ];

  const status = cancelado
    ? "Envio cancelado"
    : entregue
      ? "Entregue"
      : r.postedAt
        ? "A caminho"
        : r.generatedAt
          ? "Preparando o envio"
          : "Pedido confirmado";

  return {
    numero: Number(data.numero),
    codigo: codigoReal,
    transportadora: (data.transportadora as string) ?? "",
    status,
    entregue,
    cancelado,
    etapas,
    urlCompleto: `https://www.melhorrastreio.com.br/app/${codigoReal}`,
  };
}
