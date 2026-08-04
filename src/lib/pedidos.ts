import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { empurrarMovimentosDoPedido } from "@/lib/integracao-estoque";
import { listarProdutos } from "@/lib/produtos";
import {
  cancelarMotoboy,
  despacharMotoboy,
  idDoCodigo,
  motoboyAtivo,
  TRANSPORTADORA_MOTOBOY,
} from "@/lib/motoboy";
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

/** Status de envio aceitos pelo enum do banco — os mesmos que o painel exibe. */
export type StatusEnvio = "por-embalar" | "por-enviar" | "enviada" | "entregue";

/**
 * Traduz o ciclo de vida da praça de motoboy para o nosso enum de envio.
 *
 * O vocabulário de lá é mais fino que o nosso (dez estados contra quatro), então
 * vários caem no mesmo lugar. O corte que importa é `collected`: até ele o
 * pacote ainda está na loja; a partir dele está com o entregador.
 *
 * `cancelled` volta para "por-embalar" porque é exatamente onde o pedido fica —
 * a corrida caiu e o pacote continua no balcão, esperando ser chamado de novo.
 */
export function statusEnvioDoMotoboy(orderStatus: string): StatusEnvio | null {
  switch (orderStatus) {
    case "waiting":
    case "scheduled":
    case "preparing":
    case "pending":
    case "cancelled":
      return "por-embalar";
    case "accepted":
    case "arrived_pickup_location":
      // Entregador a caminho ou já na porta: o pacote precisa estar na mão.
      return "por-enviar";
    case "collected":
      return "enviada";
    case "delivered":
    case "completed":
      return "entregue";
    default:
      // Status novo que a praça inventar não deve sobrescrever o que já existe.
      return null;
  }
}

/** Traduz o status do Mercado Pago para o nosso enum. */
export function statusDoMercadoPago(status: string): StatusPagamento {
  if (status === "approved" || status === "authorized") return "recebido";
  if (status === "rejected" || status === "cancelled" || status === "refunded") return "recusado";
  return "pendente";
}

export type ItemDoPedido = {
  nome: string;
  /** Nome da variação escolhida ("1 kg"), ou nulo em produto simples. Vai para
      `itens_pedido.variacao_nome` — o painel já exibe. */
  variacao: string | null;
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
 * Baixa o estoque de um pedido pago — a função no banco é atômica e
 * idempotente (o webhook repete avisos; só a primeira chamada baixa). Nunca
 * lança: o pagamento já aconteceu, e um estoque que não baixou é problema
 * MENOR que um checkout derrubado; fica no log para acerto manual.
 */
async function baixarEstoque(pedidoId: string) {
  const { error } = await supabaseAdmin.rpc("baixar_estoque_do_pedido", {
    p_pedido: pedidoId,
  });
  if (error) {
    console.error(`[pedidos] falha ao baixar estoque do pedido ${pedidoId}:`, error.message);
    return;
  }

  /* A mesma baixa precisa descer no gerenciador, que é quem manda no estoque —
     senão o próximo aviso vindo de lá repõe o que esta venda acabou de tirar. */
  await empurrarMovimentosDoPedido(pedidoId);
}

/* Marca temporária que reserva o pedido para quem vai despachar. O hífen a
   mantém fora do formato de código rastreável (`^[A-Z0-9]{6,}$`), então uma
   consulta de rastreio nunca casa com ela. */
const RESERVA_MOTOBOY = "EE-DESPACHANDO";

/**
 * Chama o motoboy de um pedido pago. Não faz nada em pedido que não é de
 * motoboy nem em pedido já despachado — e nunca lança: o pagamento já entrou, e
 * uma falha aqui é um entregador a chamar na mão, não um checkout a derrubar.
 *
 * Idempotência importa mais aqui do que na baixa de estoque: o webhook do
 * Mercado Pago repete os avisos e pode entregar dois em paralelo, e cada
 * despacho a mais é um entregador a mais na rua, cobrado da loja. Por isso a
 * reserva vem ANTES da chamada — o UPDATE condicional em `codigo_rastreio is
 * null` é atômico no banco e só devolve linha para quem chegar primeiro; o
 * segundo aviso sai sem fazer nada. Se a chamada falhar depois de reservar, a
 * marca é desfeita para o próximo aviso poder tentar de novo.
 */
async function chamarMotoboy(pedidoId: string) {
  if (!motoboyAtivo()) return;

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select(
      "numero, transportadora, codigo_rastreio, subtotal, cliente_id, entrega_endereco, entrega_bairro, entrega_cep, entrega_cidade, entrega_estado",
    )
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) return;
  if (!String(pedido.transportadora ?? "").startsWith(TRANSPORTADORA_MOTOBOY)) return;
  if (pedido.codigo_rastreio) return;

  const { data: reservado } = await supabaseAdmin
    .from("pedidos")
    .update({ codigo_rastreio: RESERVA_MOTOBOY })
    .eq("id", pedidoId)
    .is("codigo_rastreio", null)
    .select("id");

  // Outro aviso do webhook chegou primeiro e já está despachando este pedido.
  if (!reservado?.length) return;

  /* `cliente_id` é nulo quando o cadastro falhou ao gravar o pedido. A entrega
     não trava por isso: o endereço está no próprio pedido, e o entregador sai
     com o número do pedido no lugar do nome — melhor que uma venda paga que
     nunca é despachada. */
  const { data: cliente } = pedido.cliente_id
    ? await supabaseAdmin
        .from("clientes")
        .select("nome, telefone")
        .eq("id", pedido.cliente_id as string)
        .maybeSingle()
    : { data: null };

  const despacho = await despacharMotoboy({
    numeroPedido: pedido.numero as number,
    enderecoLinha: String(pedido.entrega_endereco ?? ""),
    bairro: String(pedido.entrega_bairro ?? ""),
    cidade: String(pedido.entrega_cidade ?? ""),
    uf: String(pedido.entrega_estado ?? ""),
    cep: String(pedido.entrega_cep ?? ""),
    destinatario: String(cliente?.nome ?? "") || `Pedido ${pedido.numero}`,
    telefone: String(cliente?.telefone ?? ""),
    valorMercadoria: Number(pedido.subtotal ?? 0),
  });

  if (!despacho) {
    /* Solta a reserva: sem isso o pedido ficaria marcado como despachado sem
       nunca ter sido, e nenhuma tentativa futura passaria da guarda. */
    await supabaseAdmin
      .from("pedidos")
      .update({ codigo_rastreio: null })
      .eq("id", pedidoId)
      .eq("codigo_rastreio", RESERVA_MOTOBOY);
    console.error(`[pedidos] motoboy não aceitou o pedido ${pedido.numero}; chamar na mão.`);
    return;
  }

  await supabaseAdmin
    .from("pedidos")
    .update({
      codigo_rastreio: despacho.codigo,
      rastreio: despacho.trackingUrl,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", pedidoId);
}

/** Cancela a entrega de um pedido estornado. Sai calado em pedido que não é de
    motoboy ou que nunca chegou a ser despachado. */
async function cancelarMotoboyDoPedido(pedidoId: string) {
  if (!motoboyAtivo()) return;

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("numero, codigo_rastreio")
    .eq("id", pedidoId)
    .maybeSingle();

  const id = idDoCodigo(String(pedido?.codigo_rastreio ?? ""));
  if (!id) return;

  const cancelou = await cancelarMotoboy(id);
  if (!cancelou) {
    console.error(
      `[pedidos] pedido ${pedido?.numero} estornado, mas a entrega ${id} segue de pé; acertar com a praça.`,
    );
  }
}

/**
 * Reencontra produto e variação de cada item para gravar os vínculos que a
 * baixa de estoque usa. A âncora é o `sku` do item: para produto simples ele é
 * o slug; para variação é o SKU dela (único no catálogo inteiro) ou, sem SKU,
 * o slug do produto + o nome da variação. Item que não resolver (produto
 * removido/desativado no meio do caminho) fica sem vínculo — a baixa pula.
 */
async function resolverVinculos(
  itens: ItemDoPedido[],
): Promise<Map<ItemDoPedido, { produtoId: string; variacaoId: string | null }>> {
  const vinculos = new Map<ItemDoPedido, { produtoId: string; variacaoId: string | null }>();
  try {
    const catalogo = await listarProdutos();
    const porSlug = new Map(catalogo.map((p) => [p.slug, p]));

    for (const item of itens) {
      if (!item.sku) continue;

      if (!item.variacao) {
        const produto = porSlug.get(item.sku);
        if (produto) vinculos.set(item, { produtoId: produto.id, variacaoId: null });
        continue;
      }

      /* Com variação: ou o sku é o da variação (único global), ou é o slug do
         produto e o nome fecha a busca. */
      let achado: { produtoId: string; variacaoId: string } | null = null;
      for (const produto of catalogo) {
        const porSku = produto.variants.find((v) => v.sku && v.sku === item.sku);
        if (porSku) {
          achado = { produtoId: produto.id, variacaoId: porSku.id };
          break;
        }
      }
      if (!achado) {
        const produto = porSlug.get(item.sku);
        const porNome = produto?.variants.find((v) => v.name === item.variacao);
        if (produto && porNome) achado = { produtoId: produto.id, variacaoId: porNome.id };
      }
      if (achado) vinculos.set(item, achado);
    }
  } catch (erro) {
    /* Sem vínculo não há baixa, mas o pedido precisa nascer mesmo assim. */
    console.error("[pedidos] falha ao resolver vínculos dos itens:", erro);
  }
  return vinculos;
}

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

    const vinculos = await resolverVinculos(dados.itens);
    const itens = dados.itens.map((item) => {
      const vinculo = vinculos.get(item);
      return {
        pedido_id: pedido.id as string,
        produto_id: vinculo?.produtoId ?? null,
        variacao_id: vinculo?.variacaoId ?? null,
        nome_produto: item.nome,
        variacao_nome: item.variacao,
        sku: item.sku,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
      };
    });

    const { error: erroItens } = await supabaseAdmin.from("itens_pedido").insert(itens);
    if (erroItens) {
      console.error("[pedidos] pedido gravado, mas os itens falharam:", erroItens.message);
    }

    /* Cartão aprovado na hora já nasce pago — o estoque baixa aqui mesmo. O
       Pix nasce pendente e baixa quando o webhook confirmar. */
    if (dados.statusPagamento === "recebido" && !erroItens) {
      await baixarEstoque(pedido.id as string);
    }

    /* Motoboy é chamado no mesmo gatilho do estoque: pagamento confirmado. Não
       depende de `erroItens` — item que não gravou é acerto no painel, e não
       motivo para a entrega não sair. */
    if (dados.statusPagamento === "recebido") {
      await chamarMotoboy(pedido.id as string);
    }

    return { id: pedido.id as string, numero: pedido.numero as number };
  } catch (erro) {
    console.error("[pedidos] erro inesperado ao gravar o pedido:", erro);
    return null;
  }
}

/**
 * Anota o andamento de uma entrega de motoboy, a partir do webhook da praça.
 * Casa pelo `codigo_rastreio` ("EE" + id lá), gravado no despacho.
 *
 * Devolve `false` quando nenhum pedido nosso corresponde — o que é esperado: o
 * token é de administrador da praça, então a notificação chega para pedidos de
 * outros lojistas também, e esses simplesmente não têm par aqui.
 */
export async function atualizarEntregaMotoboy(
  motoboyOrderId: number,
  orderStatus: string,
  trackingUrl: string | null,
): Promise<boolean> {
  const statusEnvio = statusEnvioDoMotoboy(orderStatus);

  const campos: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (statusEnvio) campos.status_envio = statusEnvio;
  /* O link só é sobrescrito quando vem preenchido: a praça manda o objeto
     inteiro a cada evento, e um campo vazio não pode apagar o que já temos. */
  if (trackingUrl) campos.rastreio = trackingUrl;

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .update(campos)
    .eq("codigo_rastreio", `EE${motoboyOrderId}`)
    .select("id");

  if (error) {
    console.error("[pedidos] falha ao atualizar a entrega de motoboy:", error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
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
    .select("id, numero");

  if (error) {
    console.error("[pedidos] falha ao atualizar o pagamento:", error.message);
    return false;
  }

  /* Pagamento confirmado (o Pix chega por aqui) baixa o estoque. A função no
     banco é idempotente, então os avisos repetidos do webhook não baixam duas
     vezes. */
  if (status === "recebido") {
    for (const pedido of data ?? []) {
      await baixarEstoque(pedido.id as string);
      // É por aqui que o Pix aciona o motoboy — o cartão já acionou ao nascer.
      await chamarMotoboy(pedido.id as string);
    }
  }

  /* Estorno/chargeback devolve o que a venda baixou. O guarda no banco é o
     mesmo flag, invertido: só repõe pedido que baixou — recusado que nunca
     foi pago sai sem efeito, e um re-aprovado depois baixa de novo. */
  if (status === "recusado") {
    for (const pedido of data ?? []) {
      const { error: erroRepor } = await supabaseAdmin.rpc("repor_estoque_do_pedido", {
        p_pedido: pedido.id as string,
      });
      if (erroRepor) {
        console.error(`[pedidos] falha ao repor estoque do pedido ${pedido.id}:`, erroRepor.message);
        continue;
      }

      /* A reposição também é um movimento, e o gerenciador precisa dela pelo
         mesmo motivo da baixa. */
      await empurrarMovimentosDoPedido(pedido.id as string);

      /* Venda desfeita não pode deixar motoboy na rua: a entrega é cancelada
         junto. Só pega se a moto ainda não saiu — depois disso a praça recusa e
         o acerto é com a Sr Express, então fica o aviso no log. */
      await cancelarMotoboyDoPedido(pedido.id as string);
    }
  }

  return (data?.length ?? 0) > 0;
}
