import type { Metadata } from "next";
import { RastreioPanel } from "@/components/site/RastreioPanel";
import styles from "@/components/site/rastreio.module.css";

export const metadata: Metadata = {
  title: "Rastreie seu pedido | Triomax",
  description: "Acompanhe a entrega do seu pedido Triomax pelo código de rastreio.",
};

/* Página única de rastreio: só o logo no topo (volta para a home) e o painel —
   sem o cabeçalho completo e sem o rodapé. O código pode vir na URL
   (?codigo=...), para linkar direto do e-mail de confirmação. */
export default async function RastreioPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return (
    <>
      <header className={styles.topo}>
        <a className={styles.logo} href="/" aria-label="Triomax — página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.logoMark} src="/brand/triomax-mark.svg" alt="" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.logoText} src="/brand/triomax-wordmark.svg" alt="Triomax" />
        </a>
      </header>
      <main>
        <RastreioPanel codigoInicial={codigo ?? ""} />
      </main>
    </>
  );
}
