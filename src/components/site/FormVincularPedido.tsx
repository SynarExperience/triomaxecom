"use client";

import { useActionState, useState } from "react";
import { vincularPedido, type EstadoForm } from "@/app/actions/conta";
import { mascaraCep } from "@/lib/checkout";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

/*
 * Traz para a conta uma compra feita antes dela existir.
 *
 * A prova é número do pedido + CEP de entrega, e não o e-mail: o cadastro da
 * loja não verifica e-mail, então bastaria digitar o endereço de alguém para
 * herdar o histórico dessa pessoa. Quem tem a nota na mão tem os dois campos.
 */
export function FormVincularPedido() {
  const [estado, acao, pendente] = useActionState(vincularPedido, INICIAL);
  /* Controlado por necessidade, não por gosto: React zera os campos NÃO
     controlados assim que a ação do formulário termina. Sem isto, errar o CEP
     apagaria também o número do pedido, e a segunda tentativa começaria do
     zero. Vale para todos os formulários de ação da loja. */
  const [numero, setNumero] = useState("");
  const [cep, setCep] = useState("");

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

      <div className={styles.linhaDupla}>
        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="vincular-numero">
            Número do pedido
          </label>
          <input
            className={styles.input}
            id="vincular-numero"
            inputMode="numeric"
            name="numero"
            onChange={(evento) => setNumero(evento.target.value.replace(/\D/g, ""))}
            placeholder="134"
            required
            type="text"
            value={numero}
          />
        </div>

        <div className={styles.campo}>
          <label className={styles.rotulo} htmlFor="vincular-cep">
            CEP da entrega
          </label>
          <input
            className={styles.input}
            id="vincular-cep"
            inputMode="numeric"
            name="cep"
            onChange={(evento) => setCep(mascaraCep(evento.target.value))}
            placeholder="00000-000"
            required
            type="text"
            value={cep}
          />
        </div>
      </div>

      <button className={styles.botaoSecundario} disabled={pendente} type="submit">
        {pendente ? "Procurando..." : "Vincular pedido"}
      </button>
    </form>
  );
}
