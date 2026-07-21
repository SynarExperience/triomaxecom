import { notFound } from "next/navigation";
import PedidoDetalhe from "@/components/admin/PedidoDetalhe";
import { PEDIDOS } from "@/data/admin-pedidos";

/* Server component: resolve `params` e busca o pedido. Toda a UI do Nimbus fica
   em PedidoDetalhe, que é client — os subcomponentes (Page.Header, Card.Body)
   são propriedades de módulos client e não podem ser lidas daqui. */
export function generateStaticParams() {
  return PEDIDOS.map((p) => ({ id: p.id }));
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedido = PEDIDOS.find((p) => p.id === id);
  if (!pedido) notFound();

  return <PedidoDetalhe pedido={pedido} />;
}
