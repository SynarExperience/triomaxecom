import type { Metadata } from "next";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { RastreioPanel } from "@/components/site/RastreioPanel";

export const metadata: Metadata = {
  title: "Rastreie seu pedido | Triomax",
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
  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main>
        <RastreioPanel codigoInicial={codigo ?? ""} />
      </main>
      <SiteFooter />
    </>
  );
}
