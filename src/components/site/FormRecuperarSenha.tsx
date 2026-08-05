"use client";

import { useActionState, useState } from "react";
import { pedirNovaSenha, type EstadoForm } from "@/app/actions/conta";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/** Pede o link de redefinição. A confirmação é sempre a mesma, exista conta ou
    não — a tela não pode virar um confirmador de e-mails cadastrados. */
export function FormRecuperarSenha({ expirado }: { expirado?: boolean }) {
  const [estado, acao, pendente] = useActionState(pedirNovaSenha, INICIAL);
  /* React zera campo não controlado depois da ação: sem isto, um e-mail
     inválido sumiria da tela junto com o aviso de que é inválido. */
  const [email, setEmail] = useState("");

  return (
    <form action={acao} className={styles.form}>
      {expirado && !estado.ok && !estado.erro && (
        <p className={styles.avisoErro} role="alert">
          O link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      )}

      {estado.erro && (
        <p className={styles.avisoErro} role="alert">
          {estado.erro}
        </p>
      )}

      {estado.ok && (
        <p className={styles.avisoOk} role="status">
          {estado.ok}
        </p>
      )}

      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="recuperar-email">
          E-mail da conta
        </label>
        <input
          autoComplete="email"
          className={styles.input}
          id="recuperar-email"
          inputMode="email"
          name="email"
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />
      </div>

      <button className={styles.botao} disabled={pendente} type="submit">
        {pendente ? "Enviando..." : "Enviar link"}
      </button>
    </form>
  );
}
