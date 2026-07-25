"use client";

import { useState } from "react";
import type { RastreioPedido } from "@/lib/rastreio";
import styles from "./rastreio.module.css";

type Estado =
  | { fase: "vazio" }
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "naoEncontrado" }
  | { fase: "ok"; dados: RastreioPedido };

export function RastreioPanel({ codigoInicial = "" }: { codigoInicial?: string }) {
  const [codigo, setCodigo] = useState(codigoInicial.toUpperCase());
  const [estado, setEstado] = useState<Estado>({ fase: "vazio" });

  const rastrear = async () => {
    const limpo = codigo.trim();
    if (limpo.length < 6) {
      setEstado({ fase: "erro", mensagem: "Digite um código de rastreio válido." });
      return;
    }

    setEstado({ fase: "carregando" });
    try {
      const resposta = await fetch(`/api/rastreio?codigo=${encodeURIComponent(limpo)}`);
      const dados = await resposta.json();
      if (!resposta.ok) {
        setEstado({ fase: "erro", mensagem: dados.erro ?? "Não foi possível consultar." });
        return;
      }
      if (!dados.encontrado) {
        setEstado({ fase: "naoEncontrado" });
        return;
      }
      setEstado({ fase: "ok", dados: dados as RastreioPedido });
    } catch {
      setEstado({ fase: "erro", mensagem: "Falha de conexão. Tente novamente." });
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.titulo}>Rastreie seu pedido</h1>
      <p className={styles.subtitulo}>
        Digite o código de rastreio que enviamos por e-mail para acompanhar a entrega.
      </p>

      <form
        className={styles.form}
        onSubmit={(evento) => {
          evento.preventDefault();
          rastrear();
        }}
      >
        <input
          className={styles.input}
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          placeholder="Ex.: AD704465088BR"
          inputMode="text"
          autoComplete="off"
          aria-label="Código de rastreio"
        />
        <button className={styles.botao} type="submit" disabled={estado.fase === "carregando"}>
          {estado.fase === "carregando" ? "Buscando…" : "Rastrear"}
        </button>
      </form>

      {estado.fase === "erro" ? <p className={styles.erro}>{estado.mensagem}</p> : null}

      {estado.fase === "naoEncontrado" ? (
        <div className={styles.vazio}>
          Não encontramos esse código. Confira se digitou certo — a etiqueta pode levar algumas
          horas para aparecer após a postagem.
        </div>
      ) : null}

      {estado.fase === "ok" ? <Resultado dados={estado.dados} /> : null}
    </div>
  );
}

function Resultado({ dados }: { dados: RastreioPedido }) {
  const badge = dados.cancelado
    ? styles.badgeCancelado
    : dados.entregue
      ? styles.badgeEntregue
      : styles.badge;

  return (
    <div className={styles.resultado}>
      <div className={styles.cabecalho}>
        <span className={styles.pedido}>
          Pedido <strong>#{dados.numero}</strong>
          {dados.transportadora ? ` · ${dados.transportadora}` : ""}
        </span>
        <span className={badge}>{dados.status}</span>
      </div>

      <div className={styles.timeline}>
        {dados.etapas.map((etapa, indice) => {
          const proxima = dados.etapas[indice + 1];
          const ultima = indice === dados.etapas.length - 1;
          // O último passo (Entregue), concluído, ganha o verde de sucesso.
          const dotClasse = !etapa.concluida
            ? ""
            : ultima && dados.entregue
              ? styles.dotEntregue
              : styles.dotConcluida;
          return (
            <div
              key={etapa.titulo}
              className={`${styles.etapa} ${etapa.concluida ? "" : styles.etapaPendente}`}
            >
              <div className={styles.marcador}>
                <span className={`${styles.dot} ${dotClasse}`} />
                {!ultima ? (
                  <span
                    className={`${styles.linha} ${
                      etapa.concluida && proxima?.concluida ? styles.linhaConcluida : ""
                    }`}
                  />
                ) : null}
              </div>
              <div className={styles.corpoEtapa}>
                <div className={styles.etapaTitulo}>{etapa.titulo}</div>
                {etapa.data ? <div className={styles.etapaData}>{etapa.data}</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.rodape}>
        <span className={styles.codigo}>
          Código: <strong>{dados.codigo}</strong>
        </span>
        <a
          className={styles.linkCompleto}
          href={dados.urlCompleto}
          target="_blank"
          rel="noreferrer"
        >
          Ver rastreio detalhado →
        </a>
      </div>
    </div>
  );
}
