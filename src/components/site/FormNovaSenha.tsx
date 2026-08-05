"use client";

import { useActionState } from "react";
import { definirNovaSenha, type EstadoForm } from "@/app/actions/conta";
import { CampoSenha } from "./CampoSenha";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/** Define a senha nova. Serve para os dois casos: quem chegou pelo link do
    e-mail e quem já está logado e quer trocar a senha pela conta. */
export function FormNovaSenha({ aoTerminar }: { aoTerminar?: string }) {
  const [estado, acao, pendente] = useActionState(definirNovaSenha, INICIAL);

  return (
    <form action={acao} className={styles.form}>
      {estado.erro && (
        <p className={styles.avisoErro} role="alert">
          {estado.erro}
        </p>
      )}

      {estado.ok && (
        <p className={styles.avisoOk} role="status">
          {estado.ok}{" "}
          {aoTerminar && (
            <a href={aoTerminar}>Ir para a minha conta</a>
          )}
        </p>
      )}

      <CampoSenha
        ajuda="Mínimo de 8 caracteres."
        autoComplete="new-password"
        id="nova-senha"
        label="Nova senha"
      />
      <CampoSenha
        autoComplete="new-password"
        id="nova-senha-repetida"
        label="Repita a nova senha"
        name="senha_repetida"
      />

      <button className={styles.botao} disabled={pendente} type="submit">
        {pendente ? "Salvando..." : "Salvar senha"}
      </button>
    </form>
  );
}
