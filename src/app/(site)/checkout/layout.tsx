import Link from "next/link";
import styles from "@/components/site/checkout.module.css";

/**
 * O checkout tem cabeçalho próprio: só a logo, sem navegação, sem busca e sem
 * rodapé. É a mesma escolha da referência — tudo que leva o cliente para fora
 * da compra sai da tela.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Triomax" className={styles.cabecalhoLogo} src="/brand/triomax-black.svg" />
        </Link>
      </header>
      {children}
    </div>
  );
}
