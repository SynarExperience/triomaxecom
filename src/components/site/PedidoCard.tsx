import { formatBRL } from "@/data/catalog";
import type { PedidoDaConta } from "@/lib/conta";
import { formatarData, seloEnvio, seloPagamento, type Selo } from "@/lib/pedido-rotulos";
import styles from "./conta.module.css";

const CLASSE_DO_TOM = {
  ok: styles.seloOk,
  espera: styles.seloEspera,
  ruim: styles.seloRuim,
  neutro: styles.selo,
} as const;

/** Selo de status. O tom vem de `pedido-rotulos`; aqui ele só vira classe. */
export function SeloStatus({ selo }: { selo: Selo }) {
  return <span className={CLASSE_DO_TOM[selo.tom]}>{selo.texto}</span>;
}

/** Resumo de um pedido na lista. O card inteiro é o link — alvo grande é o que
    funciona no celular, onde a maior parte dessas consultas acontece. */
export function PedidoCard({ pedido }: { pedido: PedidoDaConta }) {
  const totalItens = pedido.itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <a className={styles.pedido} href={`/conta/pedidos/${pedido.numero}`}>
      <div className={styles.pedidoTopo}>
        <div>
          <span className={styles.pedidoNumero}>Pedido #{pedido.numero}</span>
          <span className={styles.pedidoData}> · {formatarData(pedido.criadoEm)}</span>
        </div>
        <div className={styles.selos}>
          <SeloStatus selo={seloPagamento(pedido.statusPagamento)} />
          {/* Envio só interessa depois que o pagamento entrou: num pedido
              recusado, "Em preparação" seria informação errada. */}
          {pedido.statusPagamento === "recebido" && (
            <SeloStatus selo={seloEnvio(pedido.statusEnvio)} />
          )}
        </div>
      </div>

      <p className={styles.pedidoItens}>
        {pedido.itens
          .map((item) => `${item.quantidade}× ${item.nome}${item.variacao ? ` (${item.variacao})` : ""}`)
          .join(" · ") || "Sem itens registrados"}
      </p>

      <div className={styles.pedidoRodape}>
        <span className={styles.pedidoData}>
          {totalItens === 1 ? "1 item" : `${totalItens} itens`}
          {pedido.transportadora ? ` · ${pedido.transportadora}` : ""}
        </span>
        <span className={styles.pedidoTotal}>{formatBRL(pedido.total)}</span>
      </div>
    </a>
  );
}
