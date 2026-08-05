import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { criarClienteDeSessao } from "@/lib/supabase-sessao";
import { digitos } from "@/lib/checkout";

/*
 * A conta do cliente: quem está logado, e o que a conta dele enxerga.
 *
 * Todas as leituras vão pela service role, que ignora RLS — e por isso TODA
 * função aqui recebe o dono como parâmetro e filtra por ele. A sessão é
 * resolvida num lugar só (`contaAtual`), a partir de `getUser()`, que valida o
 * token no servidor do Supabase; nada aqui confia em id vindo do navegador.
 *
 * Dois vínculos convivem no pedido, e a diferença importa:
 *   `cliente_id` — o cadastro no CRM, reencontrado pelo e-mail, que nasce já na
 *                  primeira compra mesmo sem conta nenhuma;
 *   `conta_id`   — quem PROVOU ser o dono. É o único que decide o que aparece
 *                  em "Meus pedidos".
 * Como o cadastro não verifica o e-mail, colar os dois entregaria o histórico
 * de alguém a quem apenas digitou o endereço certo na hora de criar a conta.
 */

/** Enum `status_pagamento` do banco, inteiro. */
export type StatusPagamentoPedido = "pendente" | "recebido" | "recusado" | "estornado";
/** Enum `status_envio` do banco, inteiro. */
export type StatusEnvioPedido =
  | "por-embalar"
  | "por-enviar"
  | "enviada"
  | "entregue"
  | "cancelada";

export type ClienteDaConta = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  aceitaEmail: boolean;
};

export type Conta = {
  /** id em `auth.users` — a chave de tudo que a conta enxerga. */
  userId: string;
  email: string;
  cliente: ClienteDaConta;
};

/* ------------------------------------------------------------------- sessão */

/** Usuário logado, validado no servidor do Supabase. `null` para visitante. */
export async function usuarioAtual(): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = await criarClienteDeSessao();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? "" };
  } catch {
    /* Supabase fora do ar não pode derrubar a home: sem sessão a loja funciona
       inteira, só que deslogada. */
    return null;
  }
}

function paraCliente(linha: Record<string, unknown>): ClienteDaConta {
  return {
    id: String(linha.id),
    nome: String(linha.nome ?? ""),
    email: String(linha.email ?? ""),
    telefone: String(linha.telefone ?? ""),
    documento: String(linha.documento ?? ""),
    aceitaEmail: Boolean(linha.aceita_email),
  };
}

/**
 * Conta do visitante atual: o usuário do Supabase mais o cadastro dele no CRM.
 *
 * O cadastro é criado na hora se faltar. Isso só acontece se algo tiver
 * quebrado no meio da criação da conta (usuário gravado, cliente não), e a
 * alternativa seria uma conta que abre em erro para sempre.
 */
export async function contaAtual(): Promise<Conta | null> {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  const { data } = await supabaseAdmin
    .from("clientes")
    .select("id, nome, email, telefone, documento, aceita_email")
    .eq("user_id", usuario.id)
    .maybeSingle();

  if (data) {
    return { userId: usuario.id, email: usuario.email, cliente: paraCliente(data) };
  }

  const { data: criado, error } = await supabaseAdmin
    .from("clientes")
    .insert({ nome: usuario.email.split("@")[0], email: usuario.email, user_id: usuario.id })
    .select("id, nome, email, telefone, documento, aceita_email")
    .single();

  if (error || !criado) {
    console.error("[conta] conta sem cadastro e sem conseguir criar um:", error?.message);
    return null;
  }

  return { userId: usuario.id, email: usuario.email, cliente: paraCliente(criado) };
}

/* ------------------------------------------------------------------ pedidos */

export type ItemDoPedidoDaConta = {
  nome: string;
  variacao: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type PedidoDaConta = {
  numero: number;
  criadoEm: string;
  statusPagamento: StatusPagamentoPedido;
  statusEnvio: StatusEnvioPedido;
  meioPagamento: string | null;
  transportadora: string | null;
  prazo: string | null;
  /** Código para consultar em `/rastreio`; nulo antes do despacho. */
  codigoRastreio: string | null;
  /** Link direto de rastreio, quando a transportadora manda um. */
  rastreio: string | null;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  entrega: {
    endereco: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
  };
  itens: ItemDoPedidoDaConta[];
};

const COLUNAS_PEDIDO =
  "numero, criado_em, status_pagamento, status_envio, meio_pagamento, transportadora, prazo, " +
  "codigo_rastreio, rastreio, subtotal, frete, desconto, total, entrega_endereco, entrega_bairro, " +
  "entrega_cep, entrega_cidade, entrega_estado, itens_pedido(nome_produto, variacao_nome, quantidade, preco_unitario)";

type LinhaItem = {
  nome_produto: string;
  variacao_nome: string | null;
  quantidade: number;
  preco_unitario: number;
};

function paraPedido(linha: Record<string, unknown>): PedidoDaConta {
  const itens = (linha.itens_pedido ?? []) as LinhaItem[];
  return {
    numero: Number(linha.numero),
    criadoEm: String(linha.criado_em),
    statusPagamento: linha.status_pagamento as StatusPagamentoPedido,
    statusEnvio: linha.status_envio as StatusEnvioPedido,
    meioPagamento: (linha.meio_pagamento as string) ?? null,
    transportadora: (linha.transportadora as string) ?? null,
    prazo: (linha.prazo as string) ?? null,
    codigoRastreio: (linha.codigo_rastreio as string) ?? null,
    rastreio: (linha.rastreio as string) ?? null,
    subtotal: Number(linha.subtotal ?? 0),
    frete: Number(linha.frete ?? 0),
    desconto: Number(linha.desconto ?? 0),
    total: Number(linha.total ?? 0),
    entrega: {
      endereco: String(linha.entrega_endereco ?? ""),
      bairro: String(linha.entrega_bairro ?? ""),
      cep: String(linha.entrega_cep ?? ""),
      cidade: String(linha.entrega_cidade ?? ""),
      estado: String(linha.entrega_estado ?? ""),
    },
    itens: itens.map((item) => ({
      nome: item.nome_produto,
      variacao: item.variacao_nome,
      quantidade: Number(item.quantidade),
      precoUnitario: Number(item.preco_unitario),
    })),
  };
}

/** Pedidos que a conta enxerga, do mais recente para o mais antigo. */
export async function listarPedidosDaConta(userId: string): Promise<PedidoDaConta[]> {
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select(COLUNAS_PEDIDO)
    .eq("conta_id", userId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[conta] falha ao listar pedidos:", error.message);
    return [];
  }
  return (data ?? []).map((linha) => paraPedido(linha as unknown as Record<string, unknown>));
}

/** Um pedido da conta. O filtro por `conta_id` é o que impede trocar o número
    na URL e ler o pedido do vizinho. */
export async function buscarPedidoDaConta(
  userId: string,
  numero: number,
): Promise<PedidoDaConta | null> {
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select(COLUNAS_PEDIDO)
    .eq("conta_id", userId)
    .eq("numero", numero)
    .maybeSingle();

  if (error || !data) return null;
  return paraPedido(data as unknown as Record<string, unknown>);
}

export type ResultadoVinculo =
  | { ok: true; vinculados: number }
  | { ok: false; erro: string };

/**
 * Traz para a conta um pedido feito antes dela existir.
 *
 * A prova de posse é número do pedido + CEP de entrega: o número sozinho é
 * sequencial e adivinhável, o CEP não. Quem acerta os dois estava com a nota na
 * mão, então os OUTROS pedidos do mesmo cadastro vêm junto — senão o cliente
 * com dez compras antigas teria que repetir isso dez vezes.
 *
 * A mensagem de erro é a mesma para pedido inexistente, CEP errado e pedido de
 * terceiro. Distinguir os casos transformaria a tela num confirmador de "este
 * número existe" para quem estiver sondando.
 */
export async function vincularPedidoAConta(
  userId: string,
  numero: number,
  cep: string,
): Promise<ResultadoVinculo> {
  const NAO_CONFERE = "Não encontramos um pedido com esse número e CEP.";

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("id, entrega_cep, cliente_id, conta_id")
    .eq("numero", numero)
    .maybeSingle();

  if (!pedido) return { ok: false, erro: NAO_CONFERE };
  if (digitos(String(pedido.entrega_cep ?? "")) !== digitos(cep)) {
    return { ok: false, erro: NAO_CONFERE };
  }

  if (pedido.conta_id) {
    return pedido.conta_id === userId
      ? { ok: false, erro: "Esse pedido já está na sua conta." }
      : { ok: false, erro: NAO_CONFERE };
  }

  /* Sem cadastro no pedido não há irmãos a encontrar: vincula só ele. */
  const filtro = supabaseAdmin.from("pedidos").update({ conta_id: userId }).is("conta_id", null);
  const { data, error } = pedido.cliente_id
    ? await filtro.eq("cliente_id", pedido.cliente_id as string).select("id")
    : await filtro.eq("id", pedido.id as string).select("id");

  if (error) {
    console.error("[conta] falha ao vincular pedido:", error.message);
    return { ok: false, erro: "Não foi possível vincular agora. Tente de novo." };
  }

  /* O cadastro antigo passa a ser o da conta quando ainda não tem dono — é o
     que faz o endereço e o telefone daquelas compras seguirem com o cliente. */
  if (pedido.cliente_id) {
    await supabaseAdmin
      .from("clientes")
      .update({ user_id: userId })
      .eq("id", pedido.cliente_id as string)
      .is("user_id", null);
  }

  return { ok: true, vinculados: data?.length ?? 0 };
}

/* ---------------------------------------------------------------- endereços */

export type EnderecoSalvo = {
  id: string;
  apelido: string;
  destinatario: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  padrao: boolean;
};

export type DadosEnderecoSalvo = Omit<EnderecoSalvo, "id" | "padrao">;

function paraEndereco(linha: Record<string, unknown>): EnderecoSalvo {
  return {
    id: String(linha.id),
    apelido: String(linha.apelido ?? ""),
    destinatario: String(linha.destinatario ?? ""),
    cep: String(linha.cep ?? ""),
    logradouro: String(linha.logradouro ?? ""),
    numero: String(linha.numero ?? ""),
    complemento: String(linha.complemento ?? ""),
    bairro: String(linha.bairro ?? ""),
    cidade: String(linha.cidade ?? ""),
    estado: String(linha.estado ?? ""),
    padrao: Boolean(linha.padrao),
  };
}

/** Endereços do cliente, com o padrão sempre em primeiro. */
export async function listarEnderecos(clienteId: string): Promise<EnderecoSalvo[]> {
  const { data, error } = await supabaseAdmin
    .from("enderecos")
    .select("id, apelido, destinatario, cep, logradouro, numero, complemento, bairro, cidade, estado, padrao")
    .eq("cliente_id", clienteId)
    .order("padrao", { ascending: false })
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("[conta] falha ao listar endereços:", error.message);
    return [];
  }
  return (data ?? []).map((linha) => paraEndereco(linha as Record<string, unknown>));
}

/** Cria ou atualiza um endereço. O primeiro do cliente já entra como padrão —
    ninguém deveria precisar marcar isso na mão para ter um. */
export async function salvarEndereco(
  clienteId: string,
  dados: DadosEnderecoSalvo,
  id?: string,
): Promise<boolean> {
  const campos = {
    cliente_id: clienteId,
    apelido: dados.apelido || null,
    destinatario: dados.destinatario,
    cep: dados.cep,
    logradouro: dados.logradouro,
    numero: dados.numero,
    complemento: dados.complemento || null,
    bairro: dados.bairro,
    cidade: dados.cidade,
    estado: dados.estado,
  };

  if (id) {
    /* `cliente_id` no filtro é a tranca: sem ele um id chutado editaria o
       endereço de outra pessoa. */
    const { error } = await supabaseAdmin
      .from("enderecos")
      .update(campos)
      .eq("id", id)
      .eq("cliente_id", clienteId);
    if (error) console.error("[conta] falha ao atualizar endereço:", error.message);
    return !error;
  }

  const { count } = await supabaseAdmin
    .from("enderecos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId);

  const { error } = await supabaseAdmin
    .from("enderecos")
    .insert({ ...campos, padrao: (count ?? 0) === 0 });
  if (error) console.error("[conta] falha ao criar endereço:", error.message);
  return !error;
}

export async function removerEndereco(clienteId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("enderecos")
    .delete()
    .eq("id", id)
    .eq("cliente_id", clienteId);
  if (error) console.error("[conta] falha ao remover endereço:", error.message);
  return !error;
}

/**
 * Troca o endereço padrão. Precisa de dois passos porque o índice único parcial
 * do banco só admite um padrão por cliente: marcar o novo antes de soltar o
 * antigo estouraria a restrição.
 */
export async function definirEnderecoPadrao(clienteId: string, id: string): Promise<boolean> {
  await supabaseAdmin
    .from("enderecos")
    .update({ padrao: false })
    .eq("cliente_id", clienteId)
    .eq("padrao", true);

  const { error } = await supabaseAdmin
    .from("enderecos")
    .update({ padrao: true })
    .eq("id", id)
    .eq("cliente_id", clienteId);

  if (error) console.error("[conta] falha ao definir endereço padrão:", error.message);
  return !error;
}

/** Endereço que o checkout oferece pronto. Nulo quando o cliente não salvou
    nenhum. */
export async function enderecoPadrao(clienteId: string): Promise<EnderecoSalvo | null> {
  const enderecos = await listarEnderecos(clienteId);
  return enderecos.find((endereco) => endereco.padrao) ?? enderecos[0] ?? null;
}

/* ---------------------------------------------------------------- favoritos */

/** Ids dos produtos favoritados, para o card decidir se o coração vem cheio. */
export async function idsFavoritos(clienteId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("favoritos")
    .select("produto_id")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[conta] falha ao listar favoritos:", error.message);
    return [];
  }
  return (data ?? []).map((linha) => String(linha.produto_id));
}

/** Favorita ou desfavorita. Devolve o estado final, que é o que a tela precisa
    para trocar o ícone sem recarregar. */
export async function alternarFavorito(
  clienteId: string,
  produtoId: string,
): Promise<boolean> {
  const { data: existente } = await supabaseAdmin
    .from("favoritos")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("produto_id", produtoId)
    .maybeSingle();

  if (existente) {
    await supabaseAdmin.from("favoritos").delete().eq("id", existente.id as string);
    return false;
  }

  /* `ignoreDuplicates` cobre o duplo-clique: a segunda chamada esbarra no
     unique (cliente, produto) e sai calada em vez de estourar. */
  const { error } = await supabaseAdmin
    .from("favoritos")
    .upsert({ cliente_id: clienteId, produto_id: produtoId }, { onConflict: "cliente_id,produto_id", ignoreDuplicates: true });

  if (error) {
    console.error("[conta] falha ao favoritar:", error.message);
    return false;
  }
  return true;
}

/* ---------------------------------------------------------------- cadastro */

export type DadosCadastro = {
  nome: string;
  telefone: string;
  documento: string;
  aceitaEmail: boolean;
};

/** Atualiza os dados cadastrais. O e-mail fica de fora de propósito: ele é a
    identidade do login, e trocá-lo é outro fluxo. */
export async function atualizarCadastro(
  clienteId: string,
  dados: DadosCadastro,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("clientes")
    .update({
      nome: dados.nome,
      telefone: digitos(dados.telefone),
      documento: digitos(dados.documento),
      aceita_email: dados.aceitaEmail,
    })
    .eq("id", clienteId);

  if (error) console.error("[conta] falha ao atualizar cadastro:", error.message);
  return !error;
}
