import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/site/CheckoutFlow";

export const metadata: Metadata = {
  title: "Finalizar compra — Triomax",
  robots: { index: false, follow: false },
};

export default function CheckoutRoute() {
  return <CheckoutFlow />;
}
