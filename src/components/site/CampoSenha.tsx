"use client";

import { useState } from "react";
import styles from "./conta.module.css";

/*
 * Campo de senha com o botão de mostrar/ocultar. Existe como componente porque
 * as quatro telas de acesso (entrar, criar conta, nova senha e troca de senha)
 * repetiriam o mesmo estado local.
 */
export function CampoSenha({
  id,
  name = "senha",
  label,
  autoComplete = "current-password",
  ajuda,
}: {
  id: string;
  name?: string;
  label: string;
  autoComplete?: string;
  ajuda?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className={styles.campo}>
      <label className={styles.rotulo} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputSenha}>
        <input
          autoComplete={autoComplete}
          className={styles.input}
          id={id}
          name={name}
          required
          type={visivel ? "text" : "password"}
        />
        <button
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className={styles.verSenha}
          onClick={() => setVisivel((atual) => !atual)}
          type="button"
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {ajuda && <span className={styles.ajuda}>{ajuda}</span>}
    </div>
  );
}
