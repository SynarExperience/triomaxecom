import type { Metadata } from "next";
import { RastreioPanel } from "@/components/site/RastreioPanel";

export const metadata: Metadata = {
  title: "Rastreie seu pedido",
  description: "Acompanhe a entrega do seu pedido Triomax pelo código de rastreio.",
};

/* Página de rastreio do cliente. O código pode vir na URL (?codigo=...), para
   linkar direto do e-mail de confirmação. */
export default async function RastreioPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return <RastreioPanel codigoInicial={codigo ?? ""} />;
}
