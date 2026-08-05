"use client";

import { useActionState, useState } from "react";
import { entrar, type EstadoForm } from "@/app/actions/conta";
import { CampoSenha } from "./CampoSenha";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/** Login do cliente. `destino` volta da URL para devolver a pessoa à página em
    que ela estava — em geral o checkout, onde perder o caminho é perder a venda. */
export function FormEntrar({ destino }: { destino: string }) {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);
  /* React zera campo não controlado depois da ação. O e-mail precisa
     sobreviver ao erro: quem errou a senha não errou o e-mail. */
  const [email, setEmail] = useState("");

  return (
    <form action={acao} className={styles.form}>
      <input name="destino" type="hidden" value={destino} />

      {estado.erro && (
        <p className={styles.avisoErro} role="alert">
          {estado.erro}
        </p>
      )}

      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="entrar-email">
          E-mail
        </label>
        <input
          autoComplete="email"
          className={styles.input}
          id="entrar-email"
          inputMode="email"
          name="email"
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />
      </div>

      <CampoSenha id="entrar-senha" label="Senha" />

      <a className={styles.linkBotao} href="/recuperar-senha">
        Esqueci minha senha
      </a>

      <button className={styles.botao} disabled={pendente} type="submit">
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
