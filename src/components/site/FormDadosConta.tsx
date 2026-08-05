"use client";

import { useActionState, useState } from "react";
import { salvarDadosCadastrais, type EstadoForm } from "@/app/actions/conta";
import type { ClienteDaConta } from "@/lib/conta";
import { mascaraDocumento, mascaraTelefone } from "@/lib/checkout";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/** Dados cadastrais. O e-mail aparece bloqueado porque é a identidade do login:
    trocá-lo é outro fluxo, não um campo de formulário. */
export function FormDadosConta({ cliente }: { cliente: ClienteDaConta }) {
  const [estado, acao, pendente] = useActionState(salvarDadosCadastrais, INICIAL);
  /* Controlado, e não `defaultValue`: React zera o formulário depois da ação, e
     com `defaultValue` o campo voltaria ao nome ANTIGO logo abaixo de um
     "Dados atualizados" — a tela contradizendo a si mesma. */
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(mascaraTelefone(cliente.telefone));
  const [documento, setDocumento] = useState(mascaraDocumento(cliente.documento));

  return (
    <form action={acao} className={styles.form}>
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
        <label className={styles.rotulo} htmlFor="dados-nome">
          Nome completo
        </label>
        <input
          autoComplete="name"
          className={styles.input}
          id="dados-nome"
          name="nome"
          onChange={(evento) => setNome(evento.target.value)}
          required
          type="text"
          value={nome}
        />
      </div>

      <div className={styles.campo}>
        <label className={styles.rotulo} htmlFor="dados-email">
          E-mail
        </label>
        <input
          className={styles.input}
          disabled
          id="dados-email"
          type="email"
          value={cliente.email}
        />
        <span className={styles.ajuda}>
          É o e-mail do seu login. Para trocar, fale com o atendimento.
        </span>
      </div>

      <div className={styles.linhaDupla}>
        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="dados-telefone">
            Celular
          </label>
          <input
            autoComplete="tel"
            className={styles.input}
            id="dados-telefone"
            inputMode="tel"
            name="telefone"
            onChange={(evento) => setTelefone(mascaraTelefone(evento.target.value))}
            placeholder="(00) 00000-0000"
            type="tel"
            value={telefone}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="dados-documento">
            CPF ou CNPJ
          </label>
          <input
            className={styles.input}
            id="dados-documento"
            inputMode="numeric"
            name="documento"
            onChange={(evento) => setDocumento(mascaraDocumento(evento.target.value))}
            placeholder="000.000.000-00"
            type="text"
            value={documento}
          />
          <span className={styles.ajuda}>Necessário para emitir a nota fiscal.</span>
        </div>
      </div>

      <label className={styles.checkbox}>
        <input defaultChecked={cliente.aceitaEmail} name="novidades" type="checkbox" />
        <span>Quero receber ofertas e novidades da Triomax por e-mail.</span>
      </label>

      <button className={styles.botao} disabled={pendente} type="submit">
        {pendente ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
