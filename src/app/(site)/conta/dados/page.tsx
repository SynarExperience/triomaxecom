import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormDadosConta } from "@/components/site/FormDadosConta";
import { FormNovaSenha } from "@/components/site/FormNovaSenha";
import { contaAtual } from "@/lib/conta";
import styles from "@/components/site/conta.module.css";

export const metadata: Metadata = {
  title: "Meus dados — Triomax",
  robots: { index: false, follow: false },
};

export default async function DadosDaContaRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta/dados");

  return (
    <>
      <section className={styles.cartao}>
        <h2 className={styles.cartaoTitulo}>Meus dados</h2>
        <p className={styles.cartaoTexto}>
          É o que a loja usa na nota fiscal e no contato sobre a entrega.
        </p>
        <FormDadosConta cliente={conta.cliente} />
      </section>

      <section className={styles.cartao}>
        <h2 className={styles.cartaoTitulo}>Trocar senha</h2>
        <p className={styles.cartaoTexto}>
          A senha nova passa a valer na hora; a sessão atual continua aberta.
        </p>
        {/* O mesmo formulário do link de recuperação: aqui a sessão já existe,
            então ele grava direto. */}
        <FormNovaSenha />
      </section>
    </>
  );
}
