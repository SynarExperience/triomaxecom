import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SeloStatus } from "@/components/site/PedidoCard";
import { formatBRL } from "@/data/catalog";
import { buscarPedidoDaConta, contaAtual } from "@/lib/conta";
import {
  formatarDataHora,
  nomeDoPagamento,
  seloEnvio,
  seloPagamento,
} from "@/lib/pedido-rotulos";
import styles from "@/components/site/conta.module.css";

export const metadata: Metadata = {
  title: "Detalhe do pedido — Triomax",
  robots: { index: false, follow: false },
};

export default async function DetalheDoPedidoRoute({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const conta = await contaAtual();
  if (!conta) redirect(`/entrar?destino=/conta/pedidos/${numero}`);

  /* A busca já filtra por `conta_id`: trocar o número na URL não abre o pedido
     de outra pessoa — devolve 404, igual a um número que não existe. */
  const pedido = await buscarPedidoDaConta(conta.userId, Number(numero));
  if (!pedido) notFound();

  const { entrega } = pedido;

  return (
    <>
      <section className={styles.cartao}>
        <div className={styles.secaoTopo}>
          <div>
            <h2 className={styles.cartaoTitulo}>Pedido #{pedido.numero}</h2>
            <p className={styles.cartaoTextoSolto}>{formatarDataHora(pedido.criadoEm)}</p>
          </div>
          <a className={styles.verTudo} href="/conta/pedidos">
            ← Voltar aos pedidos
          </a>
        </div>

        <div className={styles.selos}>
          <SeloStatus selo={seloPagamento(pedido.statusPagamento)} />
          {pedido.statusPagamento === "recebido" && (
            <SeloStatus selo={seloEnvio(pedido.statusEnvio)} />
          )}
        </div>
      </section>

      <section className={styles.cartao}>
        <h2 className={styles.cartaoTitulo}>Itens</h2>
        <p className={styles.cartaoTexto}>
          Nome e preço são os do momento da compra — mudança no catálogo não reescreve pedido
          antigo.
        </p>

        <table className={styles.tabelaItens}>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, indice) => (
              <tr key={`${item.nome}-${item.variacao ?? ""}-${indice}`}>
                <td>
                  {item.nome}
                  {item.variacao && <span className={styles.itemVariacao}>{item.variacao}</span>}
                </td>
                <td>{item.quantidade}</td>
                <td>{formatBRL(item.precoUnitario * item.quantidade)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totais}>
          <span className={styles.linhaTotal}>
            <span>Subtotal</span>
            <span>{formatBRL(pedido.subtotal)}</span>
          </span>
          <span className={styles.linhaTotal}>
            <span>Frete</span>
            <span>{pedido.frete > 0 ? formatBRL(pedido.frete) : "Grátis"}</span>
          </span>
          {pedido.desconto > 0 && (
            <span className={styles.linhaTotal}>
              <span>Desconto</span>
              <span>−{formatBRL(pedido.desconto)}</span>
            </span>
          )}
          <span className={styles.linhaTotalForte}>
            <span>Total</span>
            <span>{formatBRL(pedido.total)}</span>
          </span>
        </div>
      </section>

      <section className={styles.cartao}>
        <h2 className={styles.cartaoTitulo}>Entrega e pagamento</h2>
        <p className={styles.cartaoTexto}>
          O endereço abaixo é o desta entrega, congelado na compra — mudar o endereço salvo não
          altera pedido já feito.
        </p>

        <div className={styles.detalheGrade}>
          <div className={styles.blocoInfo}>
            <span className={styles.blocoRotulo}>Endereço</span>
            <span className={styles.blocoValor}>
              {entrega.endereco}
              <br />
              {entrega.bairro}
              <br />
              {entrega.cidade} — {entrega.estado}
              <br />
              CEP {entrega.cep}
            </span>
          </div>

          <div className={styles.blocoInfo}>
            <span className={styles.blocoRotulo}>Envio</span>
            <span className={styles.blocoValor}>
              {pedido.transportadora ?? "—"}
              {pedido.prazo && (
                <>
                  <br />
                  {pedido.prazo}
                </>
              )}
            </span>
          </div>

          <div className={styles.blocoInfo}>
            <span className={styles.blocoRotulo}>Pagamento</span>
            <span className={styles.blocoValor}>{nomeDoPagamento(pedido.meioPagamento)}</span>
          </div>

          <div className={styles.blocoInfo}>
            <span className={styles.blocoRotulo}>Rastreio</span>
            <span className={styles.blocoValor}>
              {pedido.codigoRastreio ? (
                <>
                  {pedido.codigoRastreio}
                  <br />
                  <a href={pedido.rastreio ?? `/rastreio?codigo=${pedido.codigoRastreio}`}>
                    Acompanhar entrega
                  </a>
                </>
              ) : (
                "Disponível assim que o pedido for despachado."
              )}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
