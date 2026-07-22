"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon } from "./icons";
import { PEDIDO_STORAGE_KEY } from "./CheckoutFlow";
import { formatBRL } from "@/data/catalog";
import { previsaoEntrega } from "@/lib/checkout";
import type { FormaPagamento, PedidoConfirmado } from "@/types/checkout";
import styles from "./checkout.module.css";

const NOME_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto bancário",
};

/** Lê o pedido guardado pelo checkout e confirma. Recarregar mantém a tela; a
    sessão fechada a perde, o que é o comportamento certo para um dado assim. */
export function ConfirmacaoPedido() {
  const [pedido, setPedido] = useState<PedidoConfirmado | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.sessionStorage.getItem(PEDIDO_STORAGE_KEY);
      if (bruto) setPedido(JSON.parse(bruto) as PedidoConfirmado);
    } catch {
      /* Storage indisponível ou JSON corrompido: cai no estado genérico. */
    }
    setCarregado(true);
  }, []);

  if (!carregado) return null;

  if (!pedido) {
    return (
      <div className={styles.confirmacao}>
        <h1 className={styles.titulo}>Não encontramos este pedido</h1>
        <p>O comprovante fica disponível apenas na sessão em que a compra foi feita.</p>
        <Link className={styles.voltar} href="/produtos">
          Voltar à loja
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.confirmacao}>
      <div className={styles.confirmacaoMarca}>
        <CheckIcon />
      </div>

      <h1 className={styles.titulo}>Pedido confirmado</h1>
      <p>Enviamos os detalhes para {pedido.email}.</p>
      <p className={styles.confirmacaoNumero}>Pedido {pedido.numero}</p>

      <div className={styles.confirmacaoCartao}>
        {pedido.itens.map((item) => (
          <div className={styles.resumoLinha} key={item.nome}>
            <span>
              {item.quantidade}× {item.nome}
            </span>
            <span>{formatBRL(item.total)}</span>
          </div>
        ))}

        <div className={styles.resumoLinha}>
          <span>
            {pedido.frete.transportadora}: {pedido.frete.servico}
          </span>
          <span>{pedido.frete.preco === 0 ? "Grátis" : formatBRL(pedido.frete.preco)}</span>
        </div>

        <div className={styles.resumoLinha}>
          <span>Pagamento</span>
          <span>{NOME_PAGAMENTO[pedido.pagamento]}</span>
        </div>

        <div className={styles.resumoTotal}>
          <span>Total</span>
          <strong>{formatBRL(pedido.total)}</strong>
        </div>

        <p style={{ marginBottom: 0 }}>
          Entrega prevista para <strong>{previsaoEntrega(pedido.frete.prazoDias)}</strong>, em{" "}
          {pedido.endereco.logradouro}
          {pedido.entrega.semNumero ? ", s/n" : `, ${pedido.entrega.numero}`} —{" "}
          {pedido.endereco.cidade}/{pedido.endereco.uf}.
        </p>
      </div>

      <Link className={styles.voltar} href="/produtos">
        Continuar comprando
      </Link>
    </div>
  );
}
