"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { CartaoForm, type PedidoBase } from "./CartaoForm";
import { CheckoutCampo } from "./CheckoutCampo";
import { CheckoutStepper } from "./CheckoutStepper";
import { PixPanel } from "./PixPanel";
import { ResumoPedido } from "./ResumoPedido";
import { IconeDaEntrega, logotipoDaEntrega, MarcaDaEntrega } from "./MarcaEntrega";
import {
  CardIcon,
  CheckIcon,
  ChevronDownIcon,
  HelpIcon,
  MailIcon,
  NoteIcon,
  PinIcon,
  PixIcon,
} from "./icons";
import { formatBRL } from "@/data/catalog";
import {
  cepValido,
  consultarCep,
  cotarFrete,
  documentoValido,
  emailValido,
  gerarNumeroPedido,
  mascaraCep,
  mascaraDocumento,
  mascaraTelefone,
  previsaoEntrega,
  telefoneValido,
} from "@/lib/checkout";
import type {
  DadosContato,
  DadosEntrega,
  Endereco,
  FormaPagamento,
  OpcaoFrete,
  PedidoConfirmado,
} from "@/types/checkout";
import styles from "./checkout.module.css";

/** Chave onde o pedido fechado espera a tela de confirmação. */
export const PEDIDO_STORAGE_KEY = "triomax:pedido";

/**
 * As seções vão sendo reveladas conforme o passo anterior valida — o checkout
 * de referência faz tudo numa URL só, sem recarregar. `contato` mostra e-mail e
 * CEP; `entrega` acrescenta frete, endereço e nota fiscal; `pagamento` troca
 * tudo pelo cartão de revisão e as formas de pagamento.
 */
type Fase = "contato" | "entrega" | "pagamento";

const CONTATO_VAZIO: DadosContato = { email: "", novidades: false };
const ENTREGA_VAZIA: DadosEntrega = {
  nome: "",
  sobrenome: "",
  telefone: "",
  numero: "",
  semNumero: false,
  complemento: "",
  documento: "",
};

export function CheckoutFlow() {
  const router = useRouter();
  const { lines, subtotal, count } = useCart();

  const [fase, setFase] = useState<Fase>("contato");
  const [contato, setContato] = useState<DadosContato>(CONTATO_VAZIO);
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [entrega, setEntrega] = useState<DadosEntrega>(ENTREGA_VAZIA);
  const [freteId, setFreteId] = useState<string | null>(null);
  const [verTodosFretes, setVerTodosFretes] = useState(true);
  const [pagamento, setPagamento] = useState<FormaPagamento | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

  /* Sacola vazia não tem checkout. Só age depois da hidratação — antes disso
     `lines` está vazio por definição e mandaria todo mundo para o carrinho. */
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);
  useEffect(() => {
    if (hidratado && count === 0) router.replace("/carrinho");
  }, [count, hidratado, router]);

  const [fretes, setFretes] = useState<OpcaoFrete[]>([]);
  const [cotandoFrete, setCotandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  const itensCarrinho = useMemo(
    () => lines.map((linha) => ({ slug: linha.product.slug, quantidade: linha.quantity })),
    [lines],
  );

  /* Cotação real roda no servidor: assim que o endereço fica pronto, buscamos
     as opções no Melhor Envio. Endereço novo zera a escolha anterior. */
  useEffect(() => {
    if (!endereco) {
      setFretes([]);
      return;
    }
    let ativo = true;
    setCotandoFrete(true);
    setErroFrete(null);
    setFreteId(null);
    cotarFrete(endereco.cep, itensCarrinho)
      .then((opcoes) => {
        if (!ativo) return;
        setFretes(opcoes);
        if (opcoes.length === 0) setErroFrete("Nenhuma transportadora atende esse CEP.");
      })
      .catch(() => {
        if (ativo) setErroFrete("Não foi possível calcular o frete. Tente novamente.");
      })
      .finally(() => {
        if (ativo) setCotandoFrete(false);
      });
    return () => {
      ativo = false;
    };
  }, [endereco, itensCarrinho]);

  const freteEscolhido = fretes.find((opcao) => opcao.id === freteId) ?? null;
  const total = subtotal + (freteEscolhido?.preco ?? 0);

  const errar = (campo: string, mensagem: string) =>
    setErros((atuais) => ({ ...atuais, [campo]: mensagem }));
  const limparErro = (campo: string) =>
    setErros((atuais) => {
      const { [campo]: _removido, ...resto } = atuais;
      return resto;
    });

  /* ------------------------------------------------------ passo: contato */

  const confirmarContato = async () => {
    let valido = true;
    if (!emailValido(contato.email)) {
      errar("email", "Digite um e-mail válido");
      valido = false;
    }
    if (!cepValido(cep)) {
      errar("cep", "Digite um CEP válido");
      valido = false;
    }
    if (!valido) return;

    setBuscandoCep(true);
    const encontrado = await consultarCep(cep);
    setBuscandoCep(false);

    if (!encontrado) {
      errar("cep", "Não encontramos esse CEP");
      return;
    }

    setEndereco(encontrado);
    setFase("entrega");
  };

  /* ------------------------------------------------------ passo: entrega */

  const confirmarEntrega = () => {
    const encontrados: Record<string, string> = {};
    if (!freteId) encontrados.frete = "Escolha uma forma de entrega";
    if (entrega.nome.trim().length < 2) encontrados.nome = "Este campo deve ser preenchido";
    if (entrega.sobrenome.trim().length < 2) {
      encontrados.sobrenome = "Este campo deve ser preenchido";
    }
    if (!telefoneValido(entrega.telefone)) {
      encontrados.telefone = "Este campo deve ser preenchido";
    }
    if (!entrega.semNumero && !entrega.numero.trim()) {
      encontrados.numero = "Este campo deve ser preenchido";
    }
    if (!documentoValido(entrega.documento)) {
      encontrados.documento = "Digite um número de CPF ou CNPJ válido";
    }

    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setFase("pagamento");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------------------------------------------- passo: pagamento */

  /* Dados que o pagamento precisa. O preço não vai daqui — o servidor relê pelo
     slug —, mas nome e total congelam para a tela de confirmação. */
  const pedidoBase = useMemo<PedidoBase | null>(() => {
    if (!freteEscolhido || !endereco) return null;
    return {
      itens: lines.map(({ product, variant, quantity }) => ({
        slug: product.slug,
        quantidade: quantity,
        /* O servidor confere a variação e cobra o preço DELA — nunca o daqui. */
        ...(variant ? { variacao: variant.id } : {}),
      })),
      frete: freteEscolhido,
      contato: { email: contato.email.trim() },
      entrega,
      endereco,
    };
  }, [contato.email, endereco, entrega, freteEscolhido, lines]);

  /* Chamado pelos painéis de cartão/Pix quando o Mercado Pago aprova. Guarda o
     pedido para a confirmação e navega. O id do pagamento vai junto para a tela
     poder reconferir o status pela API. */
  /* `totalCobrado` é o valor que o Mercado Pago efetivamente cobrou — no cartão
     1× traz a taxa repassada, então difere do `total` base da tela. */
  const aoAprovar = (paymentId: number, numeroPedido: number | null, totalCobrado: number) => {
    if (!pagamento || !freteEscolhido || !endereco) return;

    const pedido: PedidoConfirmado = {
      /* O número vem do banco, para o cliente ver o mesmo que aparece no
         painel. Só cai no gerado localmente se a gravação tiver falhado. */
      numero: numeroPedido ? `#${numeroPedido}` : gerarNumeroPedido(),
      email: contato.email.trim(),
      itens: lines.map(({ product, variant, quantity, total: totalLinha }) => ({
        nome: variant ? `${product.name} · ${variant.name}` : product.name,
        quantidade: quantity,
        total: totalLinha,
      })),
      subtotal,
      frete: freteEscolhido,
      total: totalCobrado,
      pagamento,
      endereco,
      entrega,
      paymentId,
    };

    try {
      window.sessionStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(pedido));
    } catch {
      /* Modo privado ou cota cheia: a confirmação cai no estado genérico. */
    }

    router.push("/checkout/confirmacao");
  };

  if (!hidratado || count === 0) return null;

  const faseStepper = fase === "pagamento" ? "pagamento" : "entrega";
  const fretesVisiveis = verTodosFretes || !freteEscolhido ? fretes : [freteEscolhido];

  return (
    <>
      <CheckoutStepper atual={faseStepper} />

      <div className={styles.conteudo}>
        <div>
          {fase === "pagamento" && pedidoBase ? (
            <SecaoPagamento
              endereco={endereco!}
              entrega={entrega}
              email={contato.email}
              erroPagamento={erroPagamento}
              frete={freteEscolhido!}
              observacoes={observacoes}
              onObservacoes={setObservacoes}
              onPagamento={(forma) => { setPagamento(forma); setErroPagamento(null); }}
              onAprovado={aoAprovar}
              onErro={setErroPagamento}
              pagamento={pagamento}
              pedido={pedidoBase}
              total={total}
            />
          ) : (
            <>
              <h2 className={styles.secaoTitulo}>Dados de contato</h2>
              <CheckoutCampo
                acao={fase === "entrega" ? { rotulo: "Alterar", onClick: () => setFase("contato") } : undefined}
                erro={erros.email}
                extras={{ autoComplete: "email", inputMode: "email", type: "email" }}
                onChange={(valor) => {
                  setContato((atual) => ({ ...atual, email: valor }));
                  limparErro("email");
                }}
                rotulo="E-mail"
                travado={fase === "entrega"}
                valido={emailValido(contato.email)}
                valor={contato.email}
              />
              <label className={styles.check}>
                <input
                  checked={contato.novidades}
                  onChange={(evento) =>
                    setContato((atual) => ({ ...atual, novidades: evento.target.checked }))
                  }
                  type="checkbox"
                />
                Receber ofertas e novidades por e-mail
              </label>

              <h2 className={styles.secaoTitulo}>Entrega</h2>

              {fase === "contato" ? (
                <>
                  <CheckoutCampo
                    acao={{
                      rotulo: "Não sei meu CEP",
                      onClick: () =>
                        window.open("https://buscacepinter.correios.com.br/app/endereco/", "_blank", "noopener"),
                    }}
                    erro={erros.cep}
                    extras={{ autoComplete: "postal-code", inputMode: "numeric" }}
                    onChange={(valor) => {
                      setCep(mascaraCep(valor));
                      limparErro("cep");
                    }}
                    rotulo="CEP"
                    valido={cepValido(cep)}
                    valor={cep}
                  />
                  <button
                    className={styles.avancar}
                    disabled={buscandoCep}
                    onClick={confirmarContato}
                    type="button"
                  >
                    {buscandoCep ? "Buscando CEP…" : "Continuar"}
                  </button>
                </>
              ) : (
                <SecaoEntrega
                  endereco={endereco!}
                  entrega={entrega}
                  cotando={cotandoFrete}
                  erroFrete={erroFrete}
                  erros={erros}
                  freteId={freteId}
                  fretes={fretesVisiveis}
                  onAlterarCep={() => {
                    setFase("contato");
                    setFreteId(null);
                    setVerTodosFretes(true);
                  }}
                  onEntrega={(mudanca) => setEntrega((atual) => ({ ...atual, ...mudanca }))}
                  onFrete={(id) => {
                    setFreteId(id);
                    setVerTodosFretes(false);
                    limparErro("frete");
                  }}
                  onLimparErro={limparErro}
                  onSubmit={confirmarEntrega}
                  onVerTodos={() => setVerTodosFretes(true)}
                  verTodos={verTodosFretes}
                />
              )}
            </>
          )}
        </div>

        <ResumoPedido frete={freteEscolhido} />
      </div>
    </>
  );
}

/* ==================================================================== */

function SecaoEntrega({
  cotando,
  endereco,
  entrega,
  erroFrete,
  erros,
  fretes,
  freteId,
  onAlterarCep,
  onEntrega,
  onFrete,
  onLimparErro,
  onSubmit,
  onVerTodos,
  verTodos,
}: {
  cotando: boolean;
  endereco: Endereco;
  entrega: DadosEntrega;
  erroFrete: string | null;
  erros: Record<string, string>;
  fretes: OpcaoFrete[];
  freteId: string | null;
  onAlterarCep: () => void;
  onEntrega: (mudanca: Partial<DadosEntrega>) => void;
  onFrete: (id: string) => void;
  onLimparErro: (campo: string) => void;
  onSubmit: () => void;
  onVerTodos: () => void;
  verTodos: boolean;
}) {
  return (
    <>
      <div className={styles.fretes}>
        {cotando && fretes.length === 0 ? (
          <p className={styles.freteInfo}>Calculando frete…</p>
        ) : (
          fretes.map((opcao) => (
            <button
              className={[styles.frete, opcao.id === freteId ? styles.freteAtivo : ""].join(" ")}
              key={opcao.id}
              onClick={() => onFrete(opcao.id)}
              type="button"
            >
              <span className={styles.freteMarca}>{opcao.id === freteId ? <CheckIcon /> : null}</span>
              <span className={styles.freteCorpo}>
                <span className={styles.freteNome}>
                  <MarcaDaEntrega opcao={opcao} />
                </span>
                <span className={styles.fretePrazo}>
                  {opcao.retirada
                    ? "Retire na loja em até 24h úteis"
                    : opcao.motoboy
                      ? "Sai hoje, direto da loja até você"
                      : /* Com logotipo, o nome do serviço vem para cá: sem ele,
                           PAC e SEDEX ficariam duas linhas iguais. */
                        [
                          logotipoDaEntrega(opcao) ? opcao.servico : null,
                          `Chega em ${opcao.prazoDias} ${opcao.prazoDias === 1 ? "dia útil" : "dias úteis"}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                </span>
              </span>
              <span className={[styles.fretePreco, opcao.preco === 0 ? styles.freteGratis : ""].join(" ")}>
                {opcao.preco === 0 ? "Grátis" : formatBRL(opcao.preco)}
              </span>
            </button>
          ))
        )}
      </div>

      {erroFrete ? <p className={styles.campoErro}>{erroFrete}</p> : null}
      {erros.frete ? <p className={styles.campoErro}>{erros.frete}</p> : null}

      {!verTodos ? (
        <button className={styles.maisOpcoes} onClick={onVerTodos} type="button">
          Mais opções
          <ChevronDownIcon />
        </button>
      ) : null}

      <h2 className={styles.secaoTitulo}>Dados para entrega</h2>

      <div className={styles.linhaCampos}>
        <CheckoutCampo
          erro={erros.nome}
          extras={{ autoComplete: "given-name" }}
          onChange={(valor) => {
            onEntrega({ nome: valor });
            onLimparErro("nome");
          }}
          rotulo="Nome"
          valido={entrega.nome.trim().length >= 2}
          valor={entrega.nome}
        />
        <CheckoutCampo
          erro={erros.sobrenome}
          extras={{ autoComplete: "family-name" }}
          onChange={(valor) => {
            onEntrega({ sobrenome: valor });
            onLimparErro("sobrenome");
          }}
          rotulo="Sobrenome"
          valido={entrega.sobrenome.trim().length >= 2}
          valor={entrega.sobrenome}
        />
      </div>

      <CheckoutCampo
        erro={erros.telefone}
        extras={{ autoComplete: "tel", inputMode: "tel", type: "tel" }}
        onChange={(valor) => {
          onEntrega({ telefone: mascaraTelefone(valor) });
          onLimparErro("telefone");
        }}
        rotulo="Telefone com DDD"
        valido={telefoneValido(entrega.telefone)}
        valor={entrega.telefone}
      />

      <div className={styles.enderecoCartao}>
        <PinIcon />
        <div className={styles.enderecoCorpo}>
          {endereco.logradouro || "Endereço"}
          <br />
          <strong>CEP {endereco.cep}</strong>
          {endereco.bairro ? ` - ${endereco.bairro}` : ""}
          <br />
          {endereco.cidade} - {endereco.uf}
        </div>
        <button className={styles.campoAcao} onClick={onAlterarCep} type="button">
          Alterar
        </button>
      </div>

      <div className={styles.linhaCampos}>
        <CheckoutCampo
          erro={erros.numero}
          extras={{ inputMode: "numeric" }}
          onChange={(valor) => {
            onEntrega({ numero: valor });
            onLimparErro("numero");
          }}
          rotulo="Número"
          travado={entrega.semNumero}
          valido={Boolean(entrega.numero.trim())}
          valor={entrega.semNumero ? "S/N" : entrega.numero}
        />
        <CheckoutCampo
          onChange={(valor) => onEntrega({ complemento: valor })}
          rotulo="Apto, bloco, referência (opcional)"
          valor={entrega.complemento}
        />
      </div>

      <label className={styles.check}>
        <input
          checked={entrega.semNumero}
          onChange={(evento) => {
            onEntrega({ semNumero: evento.target.checked });
            onLimparErro("numero");
          }}
          type="checkbox"
        />
        Sem número
      </label>

      <h2 className={styles.secaoTitulo}>Dados para nota fiscal</h2>
      <CheckoutCampo
        erro={erros.documento}
        extras={{ inputMode: "numeric" }}
        onChange={(valor) => {
          onEntrega({ documento: mascaraDocumento(valor) });
          onLimparErro("documento");
        }}
        rotulo="CPF ou CNPJ"
        valido={documentoValido(entrega.documento)}
        valor={entrega.documento}
      />

      <button className={styles.avancar} onClick={onSubmit} type="button">
        Continuar para pagamento
      </button>
    </>
  );
}

/* ==================================================================== */

const FORMAS: { id: FormaPagamento; nome: string; Icone: typeof CardIcon }[] = [
  { id: "cartao", nome: "Cartão de crédito", Icone: CardIcon },
  { id: "pix", nome: "Pix", Icone: PixIcon },
];

function SecaoPagamento({
  email,
  endereco,
  entrega,
  erroPagamento,
  frete,
  observacoes,
  onObservacoes,
  onPagamento,
  onAprovado,
  onErro,
  pagamento,
  pedido,
  total,
}: {
  email: string;
  endereco: Endereco;
  entrega: DadosEntrega;
  erroPagamento: string | null;
  frete: OpcaoFrete;
  observacoes: string;
  onObservacoes: (valor: string) => void;
  onPagamento: (forma: FormaPagamento) => void;
  onAprovado: (paymentId: number, numeroPedido: number | null, totalCobrado: number) => void;
  onErro: (mensagem: string) => void;
  pagamento: FormaPagamento | null;
  pedido: PedidoBase;
  total: number;
}) {
  const [editandoObs, setEditandoObs] = useState(false);

  return (
    <>
      <div className={styles.aviso}>
        <HelpIcon />
        Os prazos de entrega são estimativas da transportadora e podem sofrer alterações por
        fatores externos, como condições climáticas ou imprevistos logísticos.
      </div>

      <div className={styles.revisao}>
        <div className={styles.revisaoLinha}>
          <MailIcon />
          <div className={styles.revisaoCorpo}>{email}</div>
        </div>

        <div className={styles.revisaoLinha}>
          <PinIcon />
          <div className={styles.revisaoCorpo}>
            {endereco.logradouro} {entrega.semNumero ? "s/n" : entrega.numero}
            {entrega.complemento ? ` - ${entrega.complemento}` : ""}
            <br />
            CEP {endereco.cep} - {endereco.bairro}
            <br />
            {endereco.cidade}, {endereco.uf} - {entrega.telefone}
          </div>
        </div>

        <div className={styles.revisaoLinha}>
          <IconeDaEntrega opcao={frete} />
          <div className={styles.revisaoCorpo}>
            <strong>
              {frete.transportadora}: {frete.servico} ·{" "}
              {frete.preco === 0 ? "Grátis" : formatBRL(frete.preco)}
            </strong>
            <br />
            {frete.retirada
              ? "Retire na loja em até 24h úteis"
              : frete.motoboy
                ? "Sai hoje, direto da loja até você"
                : `Chega ${previsaoEntrega(frete.prazoDias)}`}
          </div>
        </div>

        <div className={styles.revisaoLinha}>
          <NoteIcon />
          <div className={styles.revisaoCorpo}>
            {editandoObs ? (
              <CheckoutCampo
                onChange={onObservacoes}
                rotulo="Instruções para o pedido"
                valor={observacoes}
              />
            ) : (
              <strong>{observacoes || "Instruções para o pedido"}</strong>
            )}
          </div>
          <button
            className={styles.campoAcao}
            onClick={() => setEditandoObs((atual) => !atual)}
            type="button"
          >
            {editandoObs ? "Pronto" : "Adicionar"}
          </button>
        </div>
      </div>

      <h2 className={styles.secaoTitulo}>Forma de pagamento</h2>

      {erroPagamento ? <p className={styles.pagamentoErro} role="alert">{erroPagamento}</p> : null}

      {/* Cada método revela o próprio painel logo abaixo da sua linha: cartão
          tokeniza e mostra as parcelas reais; Pix gera o QR. O pedido só é
          confirmado quando o Mercado Pago aprova. */}
      <div className={styles.pagamentos}>
        {FORMAS.map(({ id, nome, Icone }) => (
          <div key={id}>
            <button
              className={[styles.pagamento, pagamento === id ? styles.pagamentoAtivo : ""].join(" ")}
              onClick={() => onPagamento(id)}
              type="button"
            >
              <Icone />
              <span className={styles.pagamentoNome}>{nome}</span>
            </button>
            {pagamento === id && id === "cartao" ? (
              <CartaoForm pedido={pedido} total={total} onAprovado={onAprovado} onErro={onErro} />
            ) : null}
            {pagamento === id && id === "pix" ? (
              <PixPanel pedido={pedido} total={total} onAprovado={onAprovado} onErro={onErro} />
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
