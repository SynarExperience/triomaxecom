import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormVincularPedido } from "@/components/site/FormVincularPedido";
import { BoxIcon } from "@/components/site/icons";
import { PedidoCard } from "@/components/site/PedidoCard";
import { contaAtual, listarPedidosDaConta } from "@/lib/conta";
import styles from "@/components/site/conta.module.css";

export const metadata: Metadata = {
  title: "Meus pedidos — Triomax",
  robots: { index: false, follow: false },
};

export default async function PedidosDaContaRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta/pedidos");

  const pedidos = await listarPedidosDaConta(conta.userId);

  return (
    <>
      <section className={styles.cartao}>
        <div className={styles.secaoTopo}>
          <h2 className={styles.cartaoTitulo}>Meus pedidos</h2>
          <a className={styles.verTudo} href="/rastreio">
            Rastrear por código
          </a>
        </div>

        {pedidos.length === 0 ? (
          <div className={styles.vazio}>
            <BoxIcon />
            <p className={styles.vazioTitulo}>Você ainda não tem pedidos nesta conta</p>
            <p className={styles.vazioTexto}>
              Se comprou antes de criar a conta, use o formulário abaixo para trazer o pedido
              para cá.
            </p>
            <a className={styles.botao} href="/produtos">
              Ver produtos
            </a>
          </div>
        ) : (
          <div className={styles.listaPedidos}>
            {pedidos.map((pedido) => (
              <PedidoCard key={pedido.numero} pedido={pedido} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.cartao}>
        <h2 className={styles.cartaoTitulo}>Comprou antes de criar a conta?</h2>
        <p className={styles.cartaoTexto}>
          Informe o número do pedido e o CEP da entrega para trazê-lo para cá. Os outros pedidos
          do mesmo cadastro vêm junto.
        </p>
        <FormVincularPedido />
      </section>
    </>
  );
}
