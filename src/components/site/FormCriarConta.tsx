"use client";

import { useActionState, useState } from "react";
import { criarConta, type EstadoForm } from "@/app/actions/conta";
import { mascaraDocumento, mascaraTelefone } from "@/lib/checkout";
import { CampoSenha } from "./CampoSenha";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/*
 * Cadastro do cliente.
 *
 * Telefone e CPF/CNPJ ficam opcionais aqui de propósito: são obrigatórios na
 * nota fiscal, mas o checkout já os pede e cobrar tudo na porta de entrada é o
 * jeito mais rápido de perder um cadastro. Quem preenche agora não digita de
 * novo depois.
 */
export function FormCriarConta({ destino }: { destino: string }) {
  const [estado, acao, pendente] = useActionState(criarConta, INICIAL);
  /* Todos controlados porque React zera campo não controlado assim que a ação
     do formulário termina — e um erro de "e-mail já cadastrado" não pode
     obrigar a redigitar nome, telefone e documento. */
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");

  return (
    <form action={acao} className={styles.form}>
      <input name="destino" type="hidden" value={destino} />

      {estado.erro && (
        <p className={styles.avisoErro} role="alert">
          {estado.erro}
        </p>
      )}

      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="criar-nome">
          Nome completo
        </label>
        <input
          autoComplete="name"
          className={styles.input}
          id="criar-nome"
          name="nome"
          onChange={(evento) => setNome(evento.target.value)}
          required
          type="text"
          value={nome}
        />
      </div>

      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="criar-email">
          E-mail
        </label>
        <input
          autoComplete="email"
          className={styles.input}
          id="criar-email"
          inputMode="email"
          name="email"
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="voce@email.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className={styles.linhaDupla}>
        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="criar-telefone">
            Celular <span className={styles.opcional}>(opcional)</span>
          </label>
          <input
            autoComplete="tel"
            className={styles.input}
            id="criar-telefone"
            inputMode="tel"
            name="telefone"
            onChange={(evento) => setTelefone(mascaraTelefone(evento.target.value))}
            placeholder="(00) 00000-0000"
            type="tel"
            value={telefone}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="criar-documento">
            CPF ou CNPJ <span className={styles.opcional}>(opcional)</span>
          </label>
          <input
            className={styles.input}
            id="criar-documento"
            inputMode="numeric"
            name="documento"
            onChange={(evento) => setDocumento(mascaraDocumento(evento.target.value))}
            placeholder="000.000.000-00"
            type="text"
            value={documento}
          />
        </div>
      </div>

      <CampoSenha
        ajuda="Mínimo de 8 caracteres."
        autoComplete="new-password"
        id="criar-senha"
        label="Senha"
      />

      <label className={styles.checkbox}>
        <input defaultChecked name="novidades" type="checkbox" />
        <span>Quero receber ofertas e novidades da Triomax por e-mail.</span>
      </label>

      <button className={styles.botao} disabled={pendente} type="submit">
        {pendente ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
