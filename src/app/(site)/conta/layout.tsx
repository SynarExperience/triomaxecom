import { redirect } from "next/navigation";
import { ContaMenu } from "@/components/site/ContaMenu";
import { contaAtual } from "@/lib/conta";
import styles from "@/components/site/conta.module.css";

/*
 * Moldura da área logada: só o logotipo no topo, o menu e o conteúdo.
 *
 * Sem cabeçalho de loja, sem fita de anúncios e sem o rodapé comercial — a
 * mesma escolha do checkout e das telas de acesso. Quem entra aqui vem
 * resolver algo específico (ver um pedido, trocar um endereço), e cercar isso
 * de newsletter, categorias e bandeiras de pagamento só afasta da tarefa. A
 * volta para a loja continua a um clique, no canto.
 *
 * O middleware já barra visitante em `/conta`; o redirect abaixo é a segunda
 * tranca, para o caso de o matcher mudar um dia.
 */
export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta");

  const primeiroNome = conta.cliente.nome.trim().split(/\s+/)[0] || "tudo bem";

  return (
    <div className={styles.pagina}>
      <header className={styles.contaTopo}>
        <a className={styles.contaVoltar} href="/">
          ← Voltar para a loja
        </a>
        <a aria-label="Triomax — página inicial" className={styles.contaLogo} href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Triomax" className={styles.contaLogoImg} src="/brand/triomax-black.svg" />
        </a>
      </header>

      <header className={styles.cabecalhoConta}>
        <h1 className={styles.saudacao}>Olá, {primeiroNome}</h1>
        <p className={styles.emailConta}>{conta.email}</p>
      </header>

      <div className={styles.grade}>
        <ContaMenu />
        <div className={styles.painel}>{children}</div>
      </div>
    </div>
  );
}
