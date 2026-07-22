"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { CheckIcon } from "./icons";
import styles from "./checkout.module.css";

type Props = {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  /** Mensagem da barra vermelha sob o campo. Ausente = campo sem erro. */
  erro?: string;
  /** Marca o ✓ verde à direita. Só aparece quando o campo já tem valor. */
  valido?: boolean;
  /** Campo já confirmado: fica cinza e some o cursor de edição. */
  travado?: boolean;
  /** Botão à direita, dentro da borda — o "Alterar" / "Não sei meu CEP". */
  acao?: { rotulo: string; onClick: () => void };
  extras?: InputHTMLAttributes<HTMLInputElement>;
  children?: ReactNode;
};

/**
 * Campo do checkout com rótulo flutuante, ✓ de validado e barra de erro colada
 * embaixo — os três estados observados na referência.
 */
export function CheckoutCampo({
  rotulo,
  valor,
  onChange,
  erro,
  valido,
  travado,
  acao,
  extras,
}: Props) {
  const classes = [
    styles.campo,
    valor ? styles.campoPreenchido : "",
    erro ? styles.campoInvalido : "",
    travado ? styles.campoTravado : "",
  ].filter(Boolean).join(" ");

  return (
    <label className={classes}>
      <div className={styles.campoCaixa}>
        <span className={styles.campoRotulo}>{rotulo}</span>
        <input
          aria-invalid={erro ? true : undefined}
          disabled={travado}
          onChange={(evento) => onChange(evento.target.value)}
          value={valor}
          {...extras}
        />
        {valido && valor && !erro ? (
          <span className={styles.campoOk}>
            <CheckIcon />
          </span>
        ) : null}
        {acao ? (
          <button className={styles.campoAcao} onClick={acao.onClick} type="button">
            {acao.rotulo}
          </button>
        ) : null}
      </div>
      {erro ? (
        <p className={styles.campoErro} role="alert">
          {erro}
        </p>
      ) : null}
    </label>
  );
}
