import { redirect } from "next/navigation";
import { ContaMenu } from "@/components/site/ContaMenu";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { contaAtual } from "@/lib/conta";
import styles from "@/components/site/conta.module.css";

/*
 * Moldura da área logada. Diferente do checkout, aqui o cabeçalho e o rodapé da
 * loja ficam: a conta é lugar de passagem, e quem vem ver um pedido antigo
 * costuma sair comprando de novo.
 *
 * O middleware já barra visitante em `/conta`; o redirect abaixo é a segunda
 * tranca, para o caso de o matcher mudar um dia.
 */
export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta");

  const primeiroNome = conta.cliente.nome.trim().split(/\s+/)[0] || "tudo bem";

  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <div className={styles.pagina}>
        <nav aria-label="Você está aqui" className={styles.migalhas}>
          <a href="/">Início</a> / Minha conta
        </nav>

        <header className={styles.cabecalhoConta}>
          <h1 className={styles.saudacao}>Olá, {primeiroNome}</h1>
          <p className={styles.emailConta}>{conta.email}</p>
        </header>

        <div className={styles.grade}>
          <ContaMenu />
          <div className={styles.painel}>{children}</div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
