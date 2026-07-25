/*
 * Completa UMA compra com o cartão de teste do Mercado Pago e verifica que o
 * pagamento é aprovado e a tela de confirmação aparece.
 *
 * Usa cartão de teste oficial + nome "APRO" (força aprovação no ambiente de
 * teste). Cartão de teste não tem saldo real — não cobra nada. Se a chave for
 * de produção, o pagamento é recusado, também sem cobrança.
 *
 * Uso: node scripts/qa-pagamento-cartao.mjs [porta]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const PORTA = process.argv[2] ?? "3210";
const BASE = process.env.HTTPS_BASE ?? `http://localhost:${PORTA}`;
const SHOTS = join(import.meta.dirname, "..", "docs", "design-references", "triomax-checkout");
mkdirSync(SHOTS, { recursive: true });

// Cartão de teste Visa do Mercado Pago (BIN reconhecido por esta conta).
const CARTAO = { numero: "4235 6477 2802 5682", nome: "APRO", validade: "11/30", cvv: "123" };

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", ignoreHTTPSErrors: true });
const page = await context.newPage();
const erros = [];
page.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });

// Registra a resposta da criação do pagamento e da tokenização do MP.
let respostaCartao = null;
let respostaToken = null;
page.on("response", async (r) => {
  if (r.url().includes("/api/checkout/cartao")) {
    respostaCartao = { status: r.status(), body: await r.json().catch(() => null) };
  }
  if (r.url().includes("card_tokens")) {
    respostaToken = { status: r.status(), body: await r.json().catch(() => null) };
  }
});

const preencher = async (rot, val) => page.locator(`label:has-text("${rot}") input`).first().pressSequentially(val, { delay: 8 });

// Carrinho -> checkout -> frete real -> identificação.
await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
await page.waitForTimeout(2000); // deixa o localStorage da sacola gravar
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
if (page.url().includes("/carrinho")) throw new Error("checkout redirecionou para /carrinho — sacola vazia");
await page.locator("input[type='email']").first().waitFor({ timeout: 15000 });
await page.locator("input[type='email']").first().pressSequentially("cliente@teste.com", { delay: 8 });
await page.locator("input[inputmode='numeric']").first().pressSequentially("01310100", { delay: 8 });
await page.getByRole("button", { name: /^continuar$/i }).click();
await page.waitForTimeout(9000);
await page.getByText(/chega em .* dias? úte/i).first().click({ timeout: 25000 });
await page.waitForTimeout(800);
await preencher("Nome", "Ana");
await preencher("Sobrenome", "Souza");
await preencher("Telefone com DDD", "11987654321");
await preencher("Número", "1000");
await preencher("CPF ou CNPJ", "12345678909");
await page.getByRole("button", { name: /continuar para pagamento/i }).click();
await page.waitForTimeout(1500);

// Cartão de teste.
await page.getByRole("button", { name: /cart[aã]o de cr[eé]dito/i }).first().click();
await page.waitForTimeout(800);
await page.locator("label:has-text('Número do cartão') input").first().pressSequentially(CARTAO.numero, { delay: 12 });
await page.waitForTimeout(4000); // método + parcelas
await preencher("Nome impresso no cartão", CARTAO.nome);
await preencher("Validade", CARTAO.validade);
await preencher("Código de segurança", CARTAO.cvv);
await page.waitForTimeout(500);
await page.screenshot({ path: join(SHOTS, "desktop-13-cartao-preenchido.png"), fullPage: true });

console.log("Enviando o cartão de teste…");
await page.getByRole("button", { name: /^pagar/i }).click();

// Espera confirmação ou erro na tela.
await page.waitForURL("**/checkout/confirmacao", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);

console.log("\n--- tokenização do cartão (Mercado Pago) ---");
console.log(respostaToken ? `HTTP ${respostaToken.status}: ${JSON.stringify(respostaToken.body).slice(0, 400)}` : "(nenhuma — SDK não chegou a tokenizar)");
console.log("\n--- resposta da nossa API de pagamento ---");
console.log(respostaCartao ? JSON.stringify(respostaCartao.body) : "(nenhuma capturada)");
console.log("\n--- URL final:", page.url());

if (page.url().includes("/checkout/confirmacao")) {
  await page.screenshot({ path: join(SHOTS, "desktop-14-confirmacao.png"), fullPage: true });
  const numero = await page.getByText(/TX20/).first().innerText().catch(() => "?");
  console.log("CONFIRMADO — pedido:", numero);
} else {
  const erroTela = await page.locator("[class*='pagamentoErro'], [role='alert']").first().innerText().catch(() => "(sem mensagem)");
  console.log("NÃO confirmou. Mensagem na tela:", erroTela);
}

console.log("erros de console:", erros.slice(0, 3).join(" | ") || "nenhum");
await browser.close();
