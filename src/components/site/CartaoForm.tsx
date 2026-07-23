"use client";

import { useEffect, useRef, useState } from "react";
import { CheckoutCampo } from "./CheckoutCampo";
import { obterMercadoPago, type MercadoPagoInstance } from "@/lib/mercadopago-cliente";
import { digitos } from "@/lib/checkout";
import { formatBRL } from "@/data/catalog";
import type { DadosEntrega, Endereco, OpcaoFrete } from "@/types/checkout";
import styles from "./checkout.module.css";

/** Dados do pedido que o pagamento precisa — os mesmos para Pix e cartão. */
export type PedidoBase = {
  itens: { slug: string; quantidade: number }[];
  frete: OpcaoFrete;
  contato: { email: string };
  entrega: DadosEntrega;
  /** Endereço resolvido pelo CEP; o servidor grava no pedido. */
  endereco: Endereco;
};

type Parcela = { numero: number; rotulo: string };

/** Mês/ano no formato MM/AA enquanto digita. */
function mascaraValidade(valor: string) {
  const n = digitos(valor).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

/** Agrupa em blocos de 4, até 19 dígitos (cartões Amex têm 15). */
function mascaraCartao(valor: string) {
  return digitos(valor).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function CartaoForm({
  pedido,
  total,
  onAprovado,
  onErro,
}: {
  pedido: PedidoBase;
  total: number;
  /** Chamado com o id do pagamento quando aprovado. */
  onAprovado: (paymentId: number, numeroPedido: number | null) => void;
  onErro: (mensagem: string) => void;
}) {
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [parcela, setParcela] = useState(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [metodo, setMetodo] = useState<{ paymentMethodId: string; issuerId?: string } | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroBin, setErroBin] = useState<string | null>(null);

  const mpRef = useRef<MercadoPagoInstance | null>(null);
  useEffect(() => {
    obterMercadoPago().then((mp) => { mpRef.current = mp; }).catch(() => {
      onErro("Não foi possível carregar o pagamento. Recarregue a página.");
    });
  }, [onErro]);

  /* Com 6+ dígitos o BIN identifica a bandeira: aí buscamos o método e as
     parcelas reais do Mercado Pago (com juros, se houver). */
  useEffect(() => {
    const bin = digitos(numero).slice(0, 8);
    if (bin.length < 6 || !mpRef.current) {
      setParcelas([]);
      setMetodo(null);
      return;
    }

    let cancelado = false;
    const relogio = window.setTimeout(async () => {
      const mp = mpRef.current!;
      try {
        const metodos = await mp.getPaymentMethods({ bin });
        const primeiro = metodos.results[0];
        if (!primeiro) {
          if (!cancelado) { setErroBin("Cartão não reconhecido."); setParcelas([]); }
          return;
        }

        const cotacao = await mp.getInstallments({
          amount: total.toFixed(2),
          bin,
          paymentTypeId: "credit_card",
        });
        const opcoes = (cotacao[0]?.payer_costs ?? [])
          .filter((c) => c.installments <= 12)
          .map<Parcela>((c) => ({ numero: c.installments, rotulo: c.recommended_message }));

        if (cancelado) return;
        setErroBin(null);
        setMetodo({
          paymentMethodId: primeiro.id,
          issuerId: cotacao[0]?.issuer?.id ?? primeiro.issuer?.id?.toString(),
        });
        setParcelas(opcoes.length > 0 ? opcoes : [{ numero: 1, rotulo: `1x de ${formatBRL(total)}` }]);
        setParcela(1);
      } catch {
        if (!cancelado) setErroBin("Não foi possível consultar as parcelas.");
      }
    }, 500);

    return () => { cancelado = true; window.clearTimeout(relogio); };
  }, [numero, total]);

  const submeter = async () => {
    const mp = mpRef.current;
    if (!mp || !metodo) { onErro("Preencha os dados do cartão."); return; }

    const [mes, ano] = validade.split("/");
    if (!mes || !ano || digitos(cvv).length < 3 || nome.trim().length < 3) {
      onErro("Confira os dados do cartão.");
      return;
    }

    setProcessando(true);
    try {
      const { id: token } = await mp.createCardToken({
        cardNumber: digitos(numero),
        cardholderName: nome.trim(),
        cardExpirationMonth: mes,
        cardExpirationYear: `20${ano}`,
        securityCode: digitos(cvv),
        identificationType: digitos(pedido.entrega.documento).length > 11 ? "CNPJ" : "CPF",
        identificationNumber: digitos(pedido.entrega.documento),
      });

      const resposta = await fetch("/api/checkout/cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pedido,
          token,
          paymentMethodId: metodo.paymentMethodId,
          issuerId: metodo.issuerId,
          parcelas: parcela,
        }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) { onErro(dados.erro ?? "Falha ao processar o cartão."); return; }

      if (dados.status === "approved") {
        onAprovado(dados.id, dados.numeroPedido ?? null);
      } else if (dados.status === "in_process" || dados.status === "pending") {
        onErro("Pagamento em análise. Você receberá a confirmação por e-mail.");
      } else {
        onErro("Pagamento recusado. Confira os dados ou tente outro cartão.");
      }
    } catch {
      onErro("Não foi possível validar o cartão. Confira o número e tente de novo.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className={styles.cartaoForm}>
      <CheckoutCampo
        erro={erroBin ?? undefined}
        extras={{ autoComplete: "cc-number", inputMode: "numeric" }}
        onChange={(v) => setNumero(mascaraCartao(v))}
        rotulo="Número do cartão"
        valor={numero}
      />
      <CheckoutCampo
        extras={{ autoComplete: "cc-name" }}
        onChange={(v) => setNome(v.toUpperCase())}
        rotulo="Nome impresso no cartão"
        valor={nome}
      />
      <div className={styles.linhaCampos}>
        <CheckoutCampo
          extras={{ autoComplete: "cc-exp", inputMode: "numeric", placeholder: "MM/AA" }}
          onChange={(v) => setValidade(mascaraValidade(v))}
          rotulo="Validade"
          valor={validade}
        />
        <CheckoutCampo
          extras={{ autoComplete: "cc-csc", inputMode: "numeric" }}
          onChange={(v) => setCvv(digitos(v).slice(0, 4))}
          rotulo="Código de segurança"
          valor={cvv}
        />
      </div>

      {parcelas.length > 0 ? (
        <div className={styles.parcelas}>
          Parcelamento
          <select
            aria-label="Número de parcelas"
            onChange={(e) => setParcela(Number(e.target.value))}
            value={parcela}
          >
            {parcelas.map((p) => (
              <option key={p.numero} value={p.numero}>{p.rotulo}</option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        className={styles.avancar}
        disabled={processando || !metodo}
        onClick={submeter}
        style={{ marginTop: 20 }}
        type="button"
      >
        {processando ? "Processando…" : `Pagar ${formatBRL(total)}`}
      </button>
    </div>
  );
}
