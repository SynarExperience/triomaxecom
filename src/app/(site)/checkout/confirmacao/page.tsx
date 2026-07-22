import type { Metadata } from "next";
import { ConfirmacaoPedido } from "@/components/site/ConfirmacaoPedido";

export const metadata: Metadata = {
  title: "Pedido confirmado — Triomax",
  robots: { index: false, follow: false },
};

export default function ConfirmacaoRoute() {
  return <ConfirmacaoPedido />;
}
