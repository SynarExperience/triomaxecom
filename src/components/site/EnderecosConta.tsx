"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removerEnderecoDaConta,
  salvarEnderecoDaConta,
  tornarEnderecoPadrao,
  type EstadoForm,
} from "@/app/actions/conta";
import type { EnderecoSalvo } from "@/lib/conta";
import { cepValido, consultarCep, mascaraCep } from "@/lib/checkout";
import { HouseIcon } from "./icons";
import styles from "./conta.module.css";

const INICIAL: EstadoForm = {};

const VAZIO = {
  id: "",
  apelido: "",
  destinatario: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

type Rascunho = typeof VAZIO;

function paraRascunho(endereco: EnderecoSalvo): Rascunho {
  return {
    id: endereco.id,
    apelido: endereco.apelido,
    destinatario: endereco.destinatario,
    cep: mascaraCep(endereco.cep),
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
  };
}

/**
 * Endereços salvos: lista, formulário de criação/edição e as ações de padrão e
 * remoção.
 *
 * Rua, bairro, cidade e UF vêm do CEP, como no checkout — digitar endereço
 * inteiro à mão é onde mais se erra, e erro aqui é entrega devolvida.
 */
export function EnderecosConta({ enderecos }: { enderecos: EnderecoSalvo[] }) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState(salvarEnderecoDaConta, INICIAL);
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(VAZIO);
  const [buscandoCep, setBuscandoCep] = useState(false);

  /* Salvou: fecha o formulário e recarrega a lista, que é dado do servidor. */
  useEffect(() => {
    if (!estado.ok) return;
    setAberto(false);
    setRascunho(VAZIO);
    router.refresh();
  }, [estado.ok, router]);

  async function preencherPeloCep(valor: string) {
    const cep = mascaraCep(valor);
    setRascunho((atual) => ({ ...atual, cep }));
    if (!cepValido(cep)) return;

    setBuscandoCep(true);
    const encontrado = await consultarCep(cep);
    setBuscandoCep(false);
    /* CEP que não resolve não trava nada: os campos ficam abertos para o
       cliente completar à mão. */
    if (!encontrado) return;

    setRascunho((atual) => ({
      ...atual,
      cep: encontrado.cep,
      logradouro: encontrado.logradouro || atual.logradouro,
      bairro: encontrado.bairro || atual.bairro,
      cidade: encontrado.cidade || atual.cidade,
      estado: encontrado.uf || atual.estado,
    }));
  }

  const abrirNovo = () => {
    setRascunho(VAZIO);
    setAberto(true);
  };

  const abrirEdicao = (endereco: EnderecoSalvo) => {
    setRascunho(paraRascunho(endereco));
    setAberto(true);
  };

  const campo = (chave: keyof Rascunho) => ({
    value: rascunho[chave],
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) =>
      setRascunho((atual) => ({ ...atual, [chave]: evento.target.value })),
  });

  return (
    <>
      <section className={styles.cartao}>
        <div className={styles.secaoTopo}>
          <h2 className={styles.cartaoTitulo}>Endereços salvos</h2>
          {!aberto && (
            <button className={`${styles.botaoSecundario} ${styles.botaoPequeno}`} onClick={abrirNovo} type="button">
              Novo endereço
            </button>
          )}
        </div>

        {enderecos.length === 0 && !aberto ? (
          <div className={styles.vazio}>
            <HouseIcon />
            <p className={styles.vazioTitulo}>Nenhum endereço salvo</p>
            <p className={styles.vazioTexto}>
              Salve um endereço e ele já vem escolhido no checkout da próxima compra.
            </p>
            <button className={styles.botao} onClick={abrirNovo} type="button">
              Adicionar endereço
            </button>
          </div>
        ) : (
          <div className={styles.listaEnderecos}>
            {enderecos.map((endereco) => (
              <article
                className={endereco.padrao ? styles.enderecoPadrao : styles.enderecoCard}
                key={endereco.id}
              >
                <h3 className={styles.enderecoApelido}>
                  <span>{endereco.apelido || endereco.logradouro}</span>
                  {endereco.padrao && <span className={styles.marcaPadrao}>Padrão</span>}
                </h3>
                <span>{endereco.destinatario}</span>
                <span className={styles.enderecoTexto}>
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento ? ` — ${endereco.complemento}` : ""}
                  <br />
                  {endereco.bairro}
                  <br />
                  {endereco.cidade} — {endereco.estado} · CEP {mascaraCep(endereco.cep)}
                </span>

                <div className={styles.enderecoAcoes}>
                  <button
                    className={styles.linkBotao}
                    onClick={() => abrirEdicao(endereco)}
                    type="button"
                  >
                    Editar
                  </button>

                  {!endereco.padrao && (
                    <form action={tornarEnderecoPadrao}>
                      <input name="id" type="hidden" value={endereco.id} />
                      <button className={styles.linkBotao} type="submit">
                        Usar como padrão
                      </button>
                    </form>
                  )}

                  <form action={removerEnderecoDaConta}>
                    <input name="id" type="hidden" value={endereco.id} />
                    <button className={styles.linkBotao} type="submit">
                      Remover
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {aberto && (
        <section className={styles.cartao}>
          <h2 className={styles.cartaoTitulo}>
            {rascunho.id ? "Editar endereço" : "Novo endereço"}
          </h2>
          <p className={styles.cartaoTexto}>
            Digite o CEP e o resto vem preenchido. Confira o número antes de salvar.
          </p>

          <form action={acao} className={styles.form}>
            <input name="id" type="hidden" value={rascunho.id} />

            {estado.erro && (
              <p className={styles.avisoErro} role="alert">
                {estado.erro}
              </p>
            )}

            <div className={styles.linhaDupla}>
              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-apelido">
                  Apelido <span className={styles.opcional}>(opcional)</span>
                </label>
                <input
                  className={styles.input}
                  id="endereco-apelido"
                  name="apelido"
                  placeholder="Casa, Trabalho..."
                  type="text"
                  {...campo("apelido")}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-destinatario">
                  Quem recebe
                </label>
                <input
                  autoComplete="name"
                  className={styles.input}
                  id="endereco-destinatario"
                  name="destinatario"
                  required
                  type="text"
                  {...campo("destinatario")}
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label className={styles.rotulo} htmlFor="endereco-cep">
                CEP
              </label>
              <input
                className={styles.input}
                id="endereco-cep"
                inputMode="numeric"
                name="cep"
                onChange={(evento) => void preencherPeloCep(evento.target.value)}
                placeholder="00000-000"
                required
                type="text"
                value={rascunho.cep}
              />
              {buscandoCep && <span className={styles.ajuda}>Buscando endereço...</span>}
            </div>

            <div className={styles.campo}>
              <label className={styles.rotulo} htmlFor="endereco-logradouro">
                Rua
              </label>
              <input
                className={styles.input}
                id="endereco-logradouro"
                name="logradouro"
                required
                type="text"
                {...campo("logradouro")}
              />
            </div>

            <div className={styles.linhaDupla}>
              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-numero">
                  Número
                </label>
                <input
                  className={styles.input}
                  id="endereco-numero"
                  name="numero"
                  required
                  type="text"
                  {...campo("numero")}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-complemento">
                  Complemento <span className={styles.opcional}>(opcional)</span>
                </label>
                <input
                  className={styles.input}
                  id="endereco-complemento"
                  name="complemento"
                  type="text"
                  {...campo("complemento")}
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label className={styles.rotulo} htmlFor="endereco-bairro">
                Bairro
              </label>
              <input
                className={styles.input}
                id="endereco-bairro"
                name="bairro"
                required
                type="text"
                {...campo("bairro")}
              />
            </div>

            <div className={styles.linhaDupla}>
              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-cidade">
                  Cidade
                </label>
                <input
                  className={styles.input}
                  id="endereco-cidade"
                  name="cidade"
                  required
                  type="text"
                  {...campo("cidade")}
                />
              </div>

              <div className={styles.campo}>
                <label className={styles.rotulo} htmlFor="endereco-estado">
                  UF
                </label>
                <input
                  className={styles.input}
                  id="endereco-estado"
                  maxLength={2}
                  name="estado"
                  required
                  type="text"
                  {...campo("estado")}
                />
              </div>
            </div>

            <div className={styles.linhaDupla}>
              <button className={styles.botao} disabled={pendente} type="submit">
                {pendente ? "Salvando..." : "Salvar endereço"}
              </button>
              <button
                className={styles.botaoSecundario}
                onClick={() => setAberto(false)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
