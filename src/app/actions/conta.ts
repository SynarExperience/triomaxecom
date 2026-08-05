"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { criarClienteDeSessao } from "@/lib/supabase-sessao";
import {
  alternarFavorito,
  atualizarCadastro,
  contaAtual,
  definirEnderecoPadrao,
  removerEndereco,
  salvarEndereco,
  vincularPedidoAConta,
} from "@/lib/conta";
import { digitos, documentoValido, emailValido, telefoneValido } from "@/lib/checkout";

/*
 * Ações da conta do cliente. Tudo passa por aqui — o navegador nunca fala
 * direto com o Supabase Auth, então o token de sessão fica em cookie httpOnly e
 * a service role nunca sai do servidor.
 */

/** Estado devolvido aos formulários (`useActionState`). */
export type EstadoForm = { erro?: string; ok?: string };

/** Senha mínima da loja. O Supabase aceita 6; 8 é o piso que escolhemos, e
    subir aqui não quebra quem já tem senha antiga. */
const SENHA_MINIMA = 8;

/** Só deixa passar caminho interno: `destino` vem da URL e um `//site.com`
    viraria redirecionamento aberto para fora da loja. */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const destino = String(valor ?? "");
  return destino.startsWith("/") && !destino.startsWith("//") ? destino : "/conta";
}

/* -------------------------------------------------------------------- login */

export async function entrar(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const destino = destinoSeguro(formData.get("destino"));

  if (!emailValido(email) || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  /* Mensagem única de propósito: separar "não existe" de "senha errada"
     entregaria a lista de e-mails cadastrados a quem estiver sondando. */
  if (error) return { erro: "E-mail ou senha incorretos." };

  redirect(destino);
}

export async function sair() {
  const supabase = await criarClienteDeSessao();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ------------------------------------------------------------- criar conta */

export async function criarConta(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const telefone = digitos(String(formData.get("telefone") ?? ""));
  const documento = digitos(String(formData.get("documento") ?? ""));
  const aceitaEmail = formData.get("novidades") === "on";
  const destino = destinoSeguro(formData.get("destino"));

  if (nome.length < 2) return { erro: "Digite seu nome completo." };
  if (!emailValido(email)) return { erro: "E-mail inválido." };
  if (senha.length < SENHA_MINIMA) {
    return { erro: `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.` };
  }
  if (telefone && !telefoneValido(telefone)) return { erro: "Telefone inválido." };
  if (documento && !documentoValido(documento)) return { erro: "CPF ou CNPJ inválido." };

  /* O cadastro pode já existir sem conta: quem comprou como visitante virou
     linha em `clientes` no primeiro pedido. Reaproveitamos essa linha em vez de
     criar outra — o e-mail é único na tabela, e duas seria impossível. */
  const { data: cadastro } = await supabaseAdmin
    .from("clientes")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (cadastro?.user_id) {
    return { erro: "Já existe uma conta com esse e-mail. Faça login para entrar." };
  }

  /* `email_confirm: true` marca o e-mail como confirmado sem enviar nada. A
     loja não verifica e-mail (decisão de projeto), e sem esta linha o login
     seguinte seria recusado por "e-mail não confirmado" — conta criada que não
     entra. É por isso que pedido antigo exige número + CEP para ser vinculado:
     o e-mail aqui não é prova de nada. */
  const { data: criado, error: erroAuth } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (erroAuth || !criado?.user) {
    const jaExiste = /already|registered|exists/i.test(erroAuth?.message ?? "");
    if (jaExiste) {
      return { erro: "Já existe uma conta com esse e-mail. Faça login para entrar." };
    }
    console.error("[conta] falha ao criar usuário:", erroAuth?.message);
    return { erro: "Não foi possível criar a conta agora. Tente de novo." };
  }

  const userId = criado.user.id;
  const campos = { nome, telefone, documento, aceita_email: aceitaEmail, user_id: userId };

  const { error: erroCadastro } = cadastro
    ? await supabaseAdmin.from("clientes").update(campos).eq("id", cadastro.id as string)
    : await supabaseAdmin.from("clientes").insert({ ...campos, email });

  if (erroCadastro) {
    /* Usuário sem cadastro entraria numa conta quebrada. Desfaz para a pessoa
       poder tentar de novo com o mesmo e-mail em vez de ficar presa. */
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error("[conta] falha ao gravar o cadastro:", erroCadastro.message);
    return { erro: "Não foi possível criar a conta agora. Tente de novo." };
  }

  const supabase = await criarClienteDeSessao();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (erroLogin) return { erro: "Conta criada. Faça login para continuar." };

  redirect(destino);
}

/* -------------------------------------------------------------- senha */

/**
 * Dispara o e-mail de redefinição.
 *
 * Depende do SMTP do projeto Supabase: sem servidor próprio configurado, o
 * envio embutido é limitado a poucas mensagens por hora. A resposta é sempre a
 * mesma, com ou sem conta — dizer "esse e-mail não existe" seria um confirmador
 * de cadastro para quem estiver sondando.
 */
export async function pedirNovaSenha(
  _anterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const confirmacao = "Se houver conta com esse e-mail, o link para criar uma nova senha foi enviado.";

  if (!emailValido(email)) return { erro: "Digite um e-mail válido." };

  /* A origem sai do próprio request: assim o link volta para o domínio em que a
     pessoa está (local, prévia ou produção) sem variável de ambiente a manter. */
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "";
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? "https";

  const supabase = await criarClienteDeSessao();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocolo}://${host}/auth/callback?proximo=/nova-senha`,
  });

  if (error) console.error("[conta] falha ao enviar recuperação:", error.message);
  return { ok: confirmacao };
}

/** Grava a senha nova. Só funciona com a sessão que o link de recuperação
    abriu — ou com o cliente já logado, trocando a senha pela conta. */
export async function definirNovaSenha(
  _anterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const senha = String(formData.get("senha") ?? "");
  const repetida = String(formData.get("senha_repetida") ?? "");

  if (senha.length < SENHA_MINIMA) {
    return { erro: `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.` };
  }
  if (senha !== repetida) return { erro: "As senhas não são iguais." };

  const supabase = await criarClienteDeSessao();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "O link expirou. Peça um novo e-mail de recuperação." };

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não foi possível trocar a senha. Tente de novo." };

  return { ok: "Senha atualizada." };
}

/* ------------------------------------------------------------- dados e CRM */

export async function salvarDadosCadastrais(
  _anterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const conta = await contaAtual();
  if (!conta) return { erro: "Sessão expirada. Entre de novo." };

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "");
  const documento = String(formData.get("documento") ?? "");

  if (nome.length < 2) return { erro: "Digite seu nome completo." };
  if (telefone && !telefoneValido(telefone)) return { erro: "Telefone inválido." };
  if (documento && !documentoValido(documento)) return { erro: "CPF ou CNPJ inválido." };

  const salvou = await atualizarCadastro(conta.cliente.id, {
    nome,
    telefone,
    documento,
    aceitaEmail: formData.get("novidades") === "on",
  });

  if (!salvou) return { erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/conta", "layout");
  return { ok: "Dados atualizados." };
}

/* ---------------------------------------------------------------- endereços */

export async function salvarEnderecoDaConta(
  _anterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const conta = await contaAtual();
  if (!conta) return { erro: "Sessão expirada. Entre de novo." };

  const id = String(formData.get("id") ?? "");
  const cep = String(formData.get("cep") ?? "");
  const dados = {
    apelido: String(formData.get("apelido") ?? "").trim(),
    destinatario: String(formData.get("destinatario") ?? "").trim(),
    cep,
    logradouro: String(formData.get("logradouro") ?? "").trim(),
    numero: String(formData.get("numero") ?? "").trim(),
    complemento: String(formData.get("complemento") ?? "").trim(),
    bairro: String(formData.get("bairro") ?? "").trim(),
    cidade: String(formData.get("cidade") ?? "").trim(),
    estado: String(formData.get("estado") ?? "").trim().toUpperCase(),
  };

  if (digitos(cep).length !== 8) return { erro: "CEP inválido." };
  if (!dados.destinatario) return { erro: "Informe quem recebe a entrega." };
  if (!dados.logradouro || !dados.numero || !dados.bairro || !dados.cidade || !dados.estado) {
    return { erro: "Preencha o endereço completo." };
  }

  const salvou = await salvarEndereco(conta.cliente.id, dados, id || undefined);
  if (!salvou) return { erro: "Não foi possível salvar o endereço." };

  revalidatePath("/conta/enderecos");
  return { ok: id ? "Endereço atualizado." : "Endereço salvo." };
}

export async function removerEnderecoDaConta(formData: FormData) {
  const conta = await contaAtual();
  if (!conta) return;
  await removerEndereco(conta.cliente.id, String(formData.get("id") ?? ""));
  revalidatePath("/conta/enderecos");
}

export async function tornarEnderecoPadrao(formData: FormData) {
  const conta = await contaAtual();
  if (!conta) return;
  await definirEnderecoPadrao(conta.cliente.id, String(formData.get("id") ?? ""));
  revalidatePath("/conta/enderecos");
}

/* ---------------------------------------------------------------- favoritos */

/** Devolve o estado final do coração. Visitante sem conta recebe `null`, e a
    tela manda para o login em vez de fingir que salvou. */
export async function alternarFavoritoDaConta(produtoId: string): Promise<boolean | null> {
  const conta = await contaAtual();
  if (!conta) return null;

  const favoritado = await alternarFavorito(conta.cliente.id, produtoId);
  revalidatePath("/conta/favoritos");
  return favoritado;
}

/* ------------------------------------------------------- vincular pedido */

export async function vincularPedido(
  _anterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const conta = await contaAtual();
  if (!conta) return { erro: "Sessão expirada. Entre de novo." };

  const numero = Number(digitos(String(formData.get("numero") ?? "")));
  const cep = String(formData.get("cep") ?? "");

  if (!numero) return { erro: "Digite o número do pedido." };
  if (digitos(cep).length !== 8) return { erro: "Digite o CEP da entrega." };

  const resultado = await vincularPedidoAConta(conta.userId, numero, cep);
  if (!resultado.ok) return { erro: resultado.erro };

  revalidatePath("/conta/pedidos");
  revalidatePath("/conta");

  return {
    ok:
      resultado.vinculados > 1
        ? `Pronto! Encontramos ${resultado.vinculados} pedidos deste cadastro e trouxemos todos.`
        : "Pedido vinculado à sua conta.",
  };
}
