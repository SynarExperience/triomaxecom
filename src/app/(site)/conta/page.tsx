import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BoxIcon } from "@/components/site/icons";
import { PedidoCard } from "@/components/site/PedidoCard";
import { contaAtual, idsFavoritos, listarEnderecos, listarPedidosDaConta } from "@/lib/conta";
import styles from "@/components/site/conta.module.css";

export const metadata: Metadata = {
  title: "Minha conta — Triomax",
  robots: { index: false, follow: false },
};

/** Resumo: os números da conta e os três últimos pedidos. Quem entra aqui quase
    sempre quer uma coisa só — saber onde está a última compra. */
export default async function ContaRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta");

  const [pedidos, enderecos, favoritos] = await Promise.all([
    listarPedidosDaConta(conta.userId),
    listarEnderecos(conta.cliente.id),
    idsFavoritos(conta.cliente.id),
  ]);

  const ultimos = pedidos.slice(0, 3);

  return (
    <>
      <div className={styles.atalhos}>
        <a className={styles.atalho} href="/conta/pedidos">
          <span className={styles.atalhoNumero}>{pedidos.length}</span>
          <span className={styles.atalhoRotulo}>
            {pedidos.length === 1 ? "pedido na conta" : "pedidos na conta"}
          </span>
        </a>
        <a className={styles.atalho} href="/conta/favoritos">
          <span className={styles.atalhoNumero}>{favoritos.length}</span>
          <span className={styles.atalhoRotulo}>
            {favoritos.length === 1 ? "produto favorito" : "produtos favoritos"}
          </span>
        </a>
        <a className={styles.atalho} href="/conta/enderecos">
          <span className={styles.atalhoNumero}>{enderecos.length}</span>
          <span className={styles.atalhoRotulo}>
            {enderecos.length === 1 ? "endereço salvo" : "endereços salvos"}
          </span>
        </a>
      </div>

      <section className={styles.cartao}>
        <div className={styles.secaoTopo}>
          <h2 className={styles.cartaoTitulo}>Últimos pedidos</h2>
          {pedidos.length > 3 && (
            <a className={styles.verTudo} href="/conta/pedidos">
              Ver todos ({pedidos.length})
            </a>
          )}
        </div>

        {ultimos.length === 0 ? (
          <div className={styles.vazio}>
            <BoxIcon />
            <p className={styles.vazioTitulo}>Nenhum pedido por aqui ainda</p>
            <p className={styles.vazioTexto}>
              Quando você comprar, o pedido aparece nesta tela com o status do pagamento e da
              entrega.
            </p>
            <a className={styles.botao} href="/produtos">
              Ver produtos
            </a>
          </div>
        ) : (
          <div className={styles.listaPedidos}>
            {ultimos.map((pedido) => (
              <PedidoCard key={pedido.numero} pedido={pedido} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
