"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, PixIcon } from "./icons";
import { formatBRL } from "@/data/catalog";
import type { PedidoBase } from "./CartaoForm";
import styles from "./checkout.module.css";

type PixGerado = { id: number; qrCode: string; qrCodeBase64: string; ticketUrl: string };

/** Intervalo de verificação do pagamento. 4s é o que o próprio painel do
    Mercado Pago usa — rápido o bastante sem martelar a API. */
const INTERVALO_MS = 4000;

export function PixPanel({
  pedido,
  total,
  onAprovado,
  onErro,
}: {
  pedido: PedidoBase;
  total: number;
  onAprovado: (paymentId: number) => void;
  onErro: (mensagem: string) => void;
}) {
  const [pix, setPix] = useState<PixGerado | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const jaAprovou = useRef(false);

  const gerar = async () => {
    setGerando(true);
    try {
      const resposta = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.pix?.qrCode) {
        onErro(dados.erro ?? "Não foi possível gerar o Pix.");
        return;
      }
      setPix({ id: dados.id, ...dados.pix });
    } catch {
      onErro("Não foi possível gerar o Pix. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  /* Enquanto o QR estiver na tela, consultamos o status até aprovar. A consulta
     é a fonte da verdade — o cliente confirma o pagamento no app do banco, não
     aqui. */
  useEffect(() => {
    if (!pix) return;
    const relogio = window.setInterval(async () => {
      try {
        const resposta = await fetch(`/api/checkout/status?payment_id=${pix.id}`);
        const dados = await resposta.json();
        if (dados.status === "approved" && !jaAprovou.current) {
          jaAprovou.current = true;
          window.clearInterval(relogio);
          onAprovado(pix.id);
        }
      } catch {
        /* Falha de rede numa checagem não interrompe: a próxima tenta de novo. */
      }
    }, INTERVALO_MS);
    return () => window.clearInterval(relogio);
  }, [pix, onAprovado]);

  const copiar = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* Sem permissão de clipboard: o cliente ainda pode selecionar o texto. */
    }
  };

  if (!pix) {
    return (
      <div className={styles.pixPanel}>
        <p className={styles.pixIntro}>
          <PixIcon />
          Pague na hora pelo Pix e o pedido é confirmado automaticamente.
        </p>
        <button className={styles.avancar} disabled={gerando} onClick={gerar} type="button">
          {gerando ? "Gerando código…" : `Gerar Pix de ${formatBRL(total)}`}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pixPanel}>
      {pix.qrCodeBase64 ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          alt="QR Code do Pix"
          className={styles.pixQr}
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
        />
      ) : null}

      <p className={styles.pixInstrucao}>
        Abra o app do seu banco, escolha pagar com Pix e escaneie o QR Code — ou copie o código
        abaixo. Assim que o pagamento cair, confirmamos o pedido nesta tela.
      </p>

      <div className={styles.pixCodigo}>
        <code>{pix.qrCode}</code>
        <button onClick={copiar} type="button">
          {copiado ? <><CheckIcon /> Copiado</> : "Copiar código"}
        </button>
      </div>

      <p className={styles.pixAguardando}>Aguardando pagamento…</p>
    </div>
  );
}
