import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rastrearMelhorEnvio } from "@/lib/melhorenvio";
import { idDoCodigo, rastrearMotoboy } from "@/lib/motoboy";

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

/** "2026-07-21 17:12:21" -> "21 jul, 17:12". Aceita também o ISO com "T" que a
    praça de motoboy devolve ("2026-08-04T14:36:46.000000Z"). */
function formatar(iso: string | null): string | null {
  if (!iso) return null;
  const [dia, hora] = iso.replace("T", " ").split(" ");
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

/**
 * Mesma linha do tempo, com os marcos que existem numa entrega de motoboy: ela
 * não passa por triagem nem centro de distribuição, então as etapas são o
 * entregador aceitando a corrida, retirando na loja e entregando.
 */
async function rastrearEntregaMotoboy(
  id: number,
  pedido: { numero: unknown; transportadora: unknown; rastreio: unknown },
): Promise<RastreioPedido | null> {
  const r = await rastrearMotoboy(id);
  if (!r) return null;

  const etapas: EtapaRastreio[] = [
    { titulo: "Pedido confirmado", data: formatar(r.criadoEm), concluida: Boolean(r.criadoEm) },
    { titulo: "Entregador a caminho da loja", data: formatar(r.aceitoEm), concluida: Boolean(r.aceitoEm) },
    { titulo: "Saiu para entrega", data: formatar(r.coletadoEm), concluida: Boolean(r.coletadoEm) },
    { titulo: "Entregue", data: formatar(r.entregueEm), concluida: Boolean(r.entregue) },
  ];

  const status = r.cancelado
    ? "Entrega cancelada"
    : r.entregue
      ? "Entregue"
      : r.coletadoEm
        ? "Saiu para entrega"
        : r.aceitoEm
          ? "Entregador a caminho da loja"
          : "Pedido confirmado";

  return {
    numero: Number(pedido.numero),
    codigo: `EE${id}`,
    transportadora: (pedido.transportadora as string) ?? "Motoboy",
    status,
    entregue: r.entregue,
    cancelado: r.cancelado,
    etapas,
    /* A praça publica uma página com o entregador no mapa; é melhor que
       qualquer coisa que a gente montasse. Se ela não vier, a coluna `rastreio`
       guarda o link gravado no despacho. */
    urlCompleto: r.trackingUrl ?? String(pedido.rastreio ?? ""),
  };
}

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

  if (error || !data) return null;

  /* Pedido de motoboy: o código é "EE" + id na praça, e o ciclo de vida vem de
     lá, não do Melhor Envio. Vem antes porque esse pedido nunca tem
     `melhorenvio_order_id` — sem este desvio ele cairia no `return null`. */
  const idMotoboy = idDoCodigo(String(data.codigo_rastreio ?? ""));
  if (idMotoboy) {
    return await rastrearEntregaMotoboy(idMotoboy, data);
  }

  if (!data.melhorenvio_order_id) return null;

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
