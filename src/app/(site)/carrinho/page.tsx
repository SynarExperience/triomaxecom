import type { Metadata } from "next";
import { CarrinhoPagina } from "@/components/site/CarrinhoPagina";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listarProdutos } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Carrinho de compras — Triomax",
  /* Carrinho é pessoal e efêmero: não deve entrar em índice de busca. */
  robots: { index: false, follow: false },
};

export default async function CarrinhoRoute() {
  /* As sugestões vêm do servidor porque o catálogo já é buscado aqui de
     qualquer forma; a sacola em si é client e resolve o resto. */
  const produtos = await listarProdutos();

  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <CarrinhoPagina sugestoes={produtos} />
      <SiteFooter />
    </>
  );
}
