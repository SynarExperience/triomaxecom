import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { digitos } from "@/lib/checkout";
import type { DadosEntrega, Endereco, OpcaoFrete } from "@/types/checkout";

/*
 * Gravação do pedido no banco — o mesmo que o painel lê em `pedidos`.
 *
 * O pedido nasce junto com o pagamento (normalmente `pendente`, porque o Pix só
 * é pago depois) e o webhook do Mercado Pago atualiza o status. O vínculo entre
 * os dois é o `pagamento_id`.
 *
 * `numero` não é enviado no insert: a coluna é GENERATED ALWAYS AS IDENTITY e o
 * banco recusa valor explícito.
 */

/** Status de pagamento aceitos pelo enum do banco. */
export type StatusPagamento = "pendente" | "recebido" | "recusado";

/** Traduz o status do Mercado Pago para o nosso enum. */
export function statusDoMercadoPago(status: string): StatusPagamento {
  if (status === "approved" || status === "authorized") return "recebido";
  if (status === "rejected" || status === "cancelled" || status === "refunded") return "recusado";
  return "pendente";
}

export type ItemDoPedido = {
  nome: string;
  sku: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type DadosPedido = {
  itens: ItemDoPedido[];
  subtotal: number;
  total: number;
  frete: OpcaoFrete;
  contato: { email: string };
  entrega: DadosEntrega;
  endereco: Endereco;
  meioPagamento: "pix" | "cartao";
  pagamentoId: string;
  statusPagamento: StatusPagamento;
};

/** Reaproveita o cliente pelo e-mail — senão cada compra criaria um cadastro
    novo e o histórico do cliente ficaria picotado. */
async function acharOuCriarCliente(dados: DadosPedido): Promise<string | null> {
  const email = dados.contato.email.trim().toLowerCase();
  const nome = `${dados.entrega.nome} ${dados.entrega.sobrenome}`.trim();
  const telefone = digitos(dados.entrega.telefone);
  const documento = digitos(dados.entrega.documento);

  const { data: existente } = await supabaseAdmin
    .from("clientes")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existente?.id) {
    /* Atualiza o cadastro com o que veio agora: telefone e documento mudam, e
       o dado mais recente é o que vale para a nota e a etiqueta. */
    await supabaseAdmin
      .from("clientes")
      .update({ nome, telefone, documento, atualizado_em: new Date().toISOString() })
      .eq("id", existente.id);
    return existente.id as string;
  }

  const { data: novo, error } = await supabaseAdmin
    .from("clientes")
    .insert({ nome, email, telefone, documento })
    .select("id")
    .single();

  if (error) {
    console.error("[pedidos] falha ao criar cliente:", error.message);
    return null;
  }
  return novo?.id as string;
}

/** Endereço numa linha só, como o painel e a etiqueta esperam:
    "Rua Guamirim, 316 - Sala 6". */
function enderecoEmLinha(entrega: DadosEntrega, endereco: Endereco): string {
  const numero = entrega.semNumero ? "S/N" : entrega.numero.trim();
  const base = [endereco.logradouro, numero].filter(Boolean).join(", ");
  const complemento = entrega.complemento.trim();
  return complemento ? `${base} - ${complemento}` : base;
}

export type PedidoCriado = { id: string; numero: number };

/**
 * Cria o pedido, seus itens e (se preciso) o cliente. Devolve `null` em falha —
 * o pagamento já foi criado no Mercado Pago e não pode ser desfeito por causa
 * de um erro de gravação, então o checkout segue e o erro fica no log.
 */
export async function criarPedido(dados: DadosPedido): Promise<PedidoCriado | null> {
  try {
    const clienteId = await acharOuCriarCliente(dados);

    const { data: pedido, error } = await supabaseAdmin
      .from("pedidos")
      .insert({
        cliente_id: clienteId,
        status_pagamento: dados.statusPagamento,
        meio_pagamento: dados.meioPagamento,
        pagamento_id: dados.pagamentoId,
        transportadora: `${dados.frete.transportadora} ${dados.frete.servico}`.trim(),
        prazo: `${dados.frete.prazoDias} dias úteis`,
        frete: dados.frete.preco,
        subtotal: dados.subtotal,
        total: dados.total,
        entrega_endereco: enderecoEmLinha(dados.entrega, dados.endereco),
        entrega_bairro: dados.endereco.bairro,
        entrega_cep: dados.endereco.cep,
        entrega_cidade: dados.endereco.cidade,
        entrega_estado: dados.endereco.uf,
      })
      .select("id, numero")
      .single();

    if (error || !pedido) {
      console.error("[pedidos] falha ao gravar o pedido:", error?.message);
      return null;
    }

    const itens = dados.itens.map((item) => ({
      pedido_id: pedido.id as string,
      nome_produto: item.nome,
      sku: item.sku,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
    }));

    const { error: erroItens } = await supabaseAdmin.from("itens_pedido").insert(itens);
    if (erroItens) {
      console.error("[pedidos] pedido gravado, mas os itens falharam:", erroItens.message);
    }

    return { id: pedido.id as string, numero: pedido.numero as number };
  } catch (erro) {
    console.error("[pedidos] erro inesperado ao gravar o pedido:", erro);
    return null;
  }
}

/**
 * Atualiza o status de pagamento a partir do webhook. Casa pelo `pagamento_id`,
 * que foi gravado quando o pedido nasceu.
 */
export async function atualizarPagamento(
  pagamentoId: string,
  status: StatusPagamento,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .update({ status_pagamento: status, atualizado_em: new Date().toISOString() })
    .eq("pagamento_id", pagamentoId)
    .select("numero");

  if (error) {
    console.error("[pedidos] falha ao atualizar o pagamento:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}
