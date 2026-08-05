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
        <p>
          Este comprovante só existe na sessão em que a compra foi feita — mas o pedido está
          guardado na sua conta.
        </p>
        <Link className={styles.voltar} href="/conta/pedidos">
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  /* O número vem do banco como "#134"; só nesse formato existe página na conta.
     O gerado localmente (fallback de gravação que falhou) não tem para onde
     apontar. */
  const numeroNaConta = /^#(\d+)$/.exec(pedido.numero)?.[1] ?? null;

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

        {pedido.frete.retirada ? (
          <p style={{ marginBottom: 0 }}>
            <strong>Retirada na loja</strong> ({pedido.frete.servico}) — disponível em até 24h
            úteis. Avisamos por e-mail quando estiver pronto.
          </p>
        ) : pedido.frete.motoboy ? (
          /* Sem hora marcada: o motoboy é acionado no pagamento, mas quem dá o
             horário é a praça quando um entregador aceita a corrida. Prometer
             "em 40 minutos" seria prometer o que não está na nossa mão. */
          <p style={{ marginBottom: 0 }}>
            <strong>Um motoboy já foi acionado</strong> e vai buscar seu pedido na loja. A entrega é
            hoje, em {pedido.endereco.logradouro}
            {pedido.entrega.semNumero ? ", s/n" : `, ${pedido.entrega.numero}`} —{" "}
            {pedido.endereco.cidade}/{pedido.endereco.uf}.
          </p>
        ) : (
          <p style={{ marginBottom: 0 }}>
            Entrega prevista para <strong>{previsaoEntrega(pedido.frete.prazoDias)}</strong>, em{" "}
            {pedido.endereco.logradouro}
            {pedido.entrega.semNumero ? ", s/n" : `, ${pedido.entrega.numero}`} —{" "}
            {pedido.endereco.cidade}/{pedido.endereco.uf}.
          </p>
        )}
      </div>

      {numeroNaConta && (
        <Link className={styles.voltar} href={`/conta/pedidos/${numeroNaConta}`}>
          Acompanhar na minha conta
        </Link>
      )}

      <Link className={styles.voltar} href="/produtos">
        Continuar comprando
      </Link>
    </div>
  );
}
