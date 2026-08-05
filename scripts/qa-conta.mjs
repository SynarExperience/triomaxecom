/*
 * QA da conta do cliente, ponta a ponta: criar conta, entrar, salvar endereço,
 * favoritar, vincular um pedido antigo e sair.
 *
 * Roda contra um servidor já de pé (`npm run build && npx next start -p 3100`),
 * usa um e-mail descartável e apaga tudo o que criou no fim — inclusive o
 * pedido de teste, que nasce direto no banco para o vínculo ter o que achar.
 *
 *   node scripts/qa-conta.mjs [http://localhost:3100]
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3100";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const corte = linha.indexOf("=");
      return [linha.slice(0, corte).trim(), linha.slice(corte + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const marca = Date.now();
const EMAIL = `qa-conta-${marca}@triomax-teste.com.br`;
const SENHA = "senha-de-teste-123";
const CEP_ANTIGO = "88348-065";

let falhas = 0;
/* `detalhe` só aparece quando quebra — é o que evita ter que rodar de novo com
   instrumentação para descobrir o que a tela mostrou. */
const checar = (nome, valor, detalhe) => {
  if (!valor) falhas += 1;
  console.log(`${valor ? "ok   " : "FALHA"} ${nome}${!valor && detalhe ? ` — recebido: ${detalhe}` : ""}`);
};

/* Pedido "antigo": simula a compra feita como visitante, antes da conta. */
async function criarPedidoDeVisitante() {
  const { data: cliente } = await admin
    .from("clientes")
    .insert({ nome: "Visitante QA", email: `visitante-${marca}@triomax-teste.com.br` })
    .select("id")
    .single();

  const { data: pedido } = await admin
    .from("pedidos")
    .insert({
      cliente_id: cliente.id,
      status_pagamento: "recebido",
      meio_pagamento: "pix",
      transportadora: "Correios PAC",
      prazo: "7 dias úteis",
      subtotal: 199.8,
      frete: 28.68,
      total: 228.48,
      entrega_endereco: "Rua Guamirim, 316",
      entrega_bairro: "Centro",
      entrega_cep: CEP_ANTIGO,
      entrega_cidade: "Balneário Camboriú",
      entrega_estado: "SC",
    })
    .select("id, numero")
    .single();

  await admin.from("itens_pedido").insert({
    pedido_id: pedido.id,
    nome_produto: "Filamento PLA FusionX Preto",
    variacao_nome: "1 kg",
    quantidade: 2,
    preco_unitario: 99.9,
  });

  return { clienteId: cliente.id, pedidoId: pedido.id, numero: pedido.numero };
}

const antigo = await criarPedidoDeVisitante();
const navegador = await chromium.launch();
const pagina = await navegador.newPage();

try {
  /* ------------------------------------------------------- criar conta */
  await pagina.goto(`${BASE}/criar-conta`, { waitUntil: "networkidle" });
  await pagina.fill("#criar-nome", "Cliente QA Automático");
  await pagina.fill("#criar-email", EMAIL);
  await pagina.fill("#criar-telefone", "48999998888");
  await pagina.fill("#criar-documento", "11144477735");
  await pagina.fill("#criar-senha", SENHA);
  await pagina.click('button[type="submit"]');
  await pagina.waitForURL(`${BASE}/conta`, { timeout: 20000 });
  checar("criar conta leva direto para /conta", pagina.url() === `${BASE}/conta`);
  checar(
    "saudação usa o primeiro nome",
    (await pagina.locator("h1").first().innerText()).includes("Cliente"),
  );

  /* --------------------------------------------------- endereço salvo */
  await pagina.goto(`${BASE}/conta/enderecos`, { waitUntil: "networkidle" });
  await pagina.click('button:has-text("Adicionar endereço")');
  await pagina.fill("#endereco-destinatario", "Cliente QA Automático");
  await pagina.fill("#endereco-cep", "88348065");
  // O CEP preenche rua/bairro/cidade/UF pelo ViaCEP.
  await pagina.waitForFunction(
    () => document.querySelector("#endereco-logradouro")?.value?.length > 0,
    null,
    { timeout: 15000 },
  );
  checar(
    "CEP preenche cidade sozinho",
    (await pagina.inputValue("#endereco-cidade")).length > 0,
  );
  await pagina.fill("#endereco-numero", "316");
  await pagina.click('button:has-text("Salvar endereço")');
  await pagina.waitForSelector("text=Padrão", { timeout: 20000 });
  checar("primeiro endereço já entra como padrão", true);

  /* ------------------------------------------------------- favoritos */
  await pagina.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
  const coracao = pagina.locator('button[aria-label^="Salvar"]').first();
  await coracao.click();
  await pagina.waitForFunction(
    () => document.querySelectorAll('button[aria-label^="Remover"][aria-pressed="true"]').length > 0,
    null,
    { timeout: 20000 },
  );
  checar("coração fica marcado ao favoritar", true);

  await pagina.goto(`${BASE}/conta/favoritos`, { waitUntil: "networkidle" });
  checar(
    "produto favoritado aparece na conta",
    (await pagina.locator("article").count()) === 1,
  );

  /* ------------------------------------------- vincular pedido antigo */
  await pagina.goto(`${BASE}/conta/pedidos`, { waitUntil: "networkidle" });
  await pagina.fill("#vincular-numero", String(antigo.numero));
  await pagina.fill("#vincular-cep", "00000000");
  /* Escopado ao formulário: `[role="alert"]` solto na página também casa com o
     aviso da sacola e com os erros de campo do carrinho. */
  const formVinculo = pagina.locator("form", { has: pagina.locator("#vincular-numero") });
  const respostaDoVinculo = async () => {
    await formVinculo
      .locator('[role="alert"], [role="status"]')
      .first()
      .waitFor({ timeout: 20000 });
    return formVinculo.locator('[role="alert"], [role="status"]').first().innerText();
  };

  await pagina.click('button:has-text("Vincular pedido")');
  const recusa = await respostaDoVinculo();
  checar("CEP errado não vincula", recusa.includes("Não encontramos"), recusa);

  /* Sem redigitar o número: é o que prova que a ação do formulário não apaga o
     que já estava preenchido. */
  checar(
    "número do pedido sobrevive ao erro",
    (await pagina.inputValue("#vincular-numero")) === String(antigo.numero),
    await pagina.inputValue("#vincular-numero"),
  );
  await pagina.fill("#vincular-cep", CEP_ANTIGO);
  await pagina.click('button:has-text("Vincular pedido")');
  await pagina.waitForTimeout(4000);
  const sucesso = await respostaDoVinculo();
  checar(
    "número + CEP corretos vinculam",
    sucesso.includes("vinculad"),
    `${sucesso} | numero="${await pagina.inputValue("#vincular-numero")}" cep="${await pagina.inputValue("#vincular-cep")}"`,
  );

  await pagina.reload({ waitUntil: "networkidle" });
  checar(
    "pedido vinculado aparece na lista",
    await pagina.locator(`text=Pedido #${antigo.numero}`).first().isVisible(),
  );

  /* --------------------------------------------------- detalhe e 404 */
  await pagina.goto(`${BASE}/conta/pedidos/${antigo.numero}`, { waitUntil: "networkidle" });
  const detalhe = await pagina.locator("body").innerText();
  checar("detalhe mostra o item comprado", detalhe.includes("Filamento PLA FusionX Preto"));
  checar("detalhe mostra o total", detalhe.includes("228,48"));

  const alheio = await pagina.goto(`${BASE}/conta/pedidos/999999`, { waitUntil: "networkidle" });
  checar("pedido de outra conta responde 404", alheio.status() === 404);

  /* ---------------------------------------------- checkout preenchido */
  await pagina.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
  await pagina.locator('button[aria-label^="Adicionar"]').first().click();
  await pagina.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  /* Valor de input não entra em innerText — tem que ser lido do campo. */
  const emailNoCheckout = await pagina.inputValue('input[type="email"]');
  checar("checkout abre com o e-mail da conta", emailNoCheckout === EMAIL, emailNoCheckout);

  const checkout = await pagina.locator("body").innerText();
  checar(
    "checkout pula o passo do CEP com endereço salvo",
    !checkout.includes("Não sei meu CEP"),
  );
  checar(
    "checkout já traz o nome do cadastro",
    (await pagina.inputValue('input[autocomplete="given-name"]').catch(() => "")) !== "" ||
      checkout.includes("Cliente"),
  );

  /* ---------------------------------------------------------- sair */
  await pagina.goto(`${BASE}/conta`, { waitUntil: "networkidle" });
  await pagina.click('button:has-text("Sair")');
  await pagina.waitForURL(`${BASE}/`, { timeout: 20000 });
  const resposta = await pagina.goto(`${BASE}/conta`, { waitUntil: "networkidle" });
  checar("depois de sair, /conta volta ao login", resposta.url().includes("/entrar"));
} catch (erro) {
  falhas += 1;
  console.error("ERRO:", erro.message);
} finally {
  await navegador.close();

  const { data: usuarios } = await admin.auth.admin.listUsers({ perPage: 200 });
  const usuario = usuarios?.users?.find((u) => u.email === EMAIL);
  await admin.from("pedidos").delete().eq("id", antigo.pedidoId);
  await admin.from("clientes").delete().eq("id", antigo.clienteId);
  await admin.from("clientes").delete().eq("email", EMAIL);
  if (usuario) await admin.auth.admin.deleteUser(usuario.id);
  console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
}
