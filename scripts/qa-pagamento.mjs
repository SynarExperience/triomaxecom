/*
 * QA da tela de pagamento (Checkout Transparente). Percorre até a etapa de
 * pagamento e verifica:
 *  - só Pix e Cartão aparecem (boleto foi removido);
 *  - escolher Cartão revela o formulário e o SDK do Mercado Pago carrega;
 *  - digitar um BIN de teste traz as parcelas reais do MP (até 12x);
 *  - escolher Pix mostra o botão de gerar.
 *
 * NÃO conclui pagamento — não cria Pix nem tokeniza cartão de verdade.
 *
 * Uso: node scripts/qa-pagamento.mjs [porta]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const PORTA = process.argv[2] ?? "3210";
const BASE = `http://localhost:${PORTA}`;
const SHOTS = join(import.meta.dirname, "..", "docs", "design-references", "triomax-checkout");
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
const page = await context.newPage();
const erros = [];
page.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => erros.push("pageerror: " + String(e).slice(0, 160)));

const falhas = [];
const checar = (cond, msg) => { if (!cond) falhas.push(msg); console.log(cond ? "  ok  " : "  FALHA", msg); };

// Chega até a etapa de pagamento.
await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
await page.waitForTimeout(1000);
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.locator("input[type='email']").first().pressSequentially("cliente@teste.com", { delay: 10 });
await page.locator("input[inputmode='numeric']").first().pressSequentially("01310100", { delay: 10 });
await page.getByRole("button", { name: /^continuar$/i }).click();
// Frete real (Melhor Envio) demora mais que o mock; espera as opções surgirem e
// clica na primeira, seja qual for a transportadora.
const primeiroFrete = page.locator("button").filter({ has: page.locator("span") }).nth(0);
await page.locator("[class*='frete']").first().waitFor({ timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1500);
const fretes = page.getByText(/chega em .* dias? úte/i);
await fretes.first().click({ timeout: 25000 });
const preencher = async (rot, val) => page.locator(`label:has-text("${rot}") input`).first().pressSequentially(val, { delay: 8 });
await preencher("Nome", "Ana");
await preencher("Sobrenome", "Souza");
await preencher("Telefone com DDD", "11987654321");
await preencher("Número", "1000");
await preencher("CPF ou CNPJ", "12345678909");
await page.getByRole("button", { name: /continuar para pagamento/i }).click();
await page.waitForTimeout(1500);

console.log("\n=== etapa de pagamento ===");
checar(await page.getByText(/forma de pagamento/i).count() > 0, "chegou em Forma de pagamento");
checar(await page.getByRole("button", { name: /cart[aã]o de cr[eé]dito/i }).count() > 0, "oferece Cartão");
checar(await page.getByRole("button", { name: /^Pix$/i }).count() > 0, "oferece Pix");
checar(await page.getByText(/boleto/i).count() === 0, "boleto foi removido");

// Cartão → formulário + SDK + parcelas.
await page.getByRole("button", { name: /cart[aã]o de cr[eé]dito/i }).first().click();
await page.waitForTimeout(1200);
checar(await page.getByText(/número do cartão/i).count() > 0, "formulário de cartão aparece");

// BIN Mastercard reconhecido por esta conta (552221). Não é cartão real e não
// tokenizamos — só dispara a busca de parcelas.
await page.locator("label:has-text('Número do cartão') input").first().pressSequentially("5522210000000008", { delay: 15 });
await page.waitForTimeout(4000); // getPaymentMethods + getInstallments
await page.screenshot({ path: join(SHOTS, "desktop-11-cartao.png"), fullPage: true });
const temParcelas = await page.locator("select[aria-label='Número de parcelas'] option").count();
checar(temParcelas > 0, `parcelas carregaram do Mercado Pago (${temParcelas} opção/opções)`);
if (temParcelas > 0) {
  const rotulos = await page.locator("select[aria-label='Número de parcelas'] option").allInnerTexts();
  console.log("       parcelas oferecidas:", rotulos.join(" | "));
  checar(temParcelas <= 12, "no máximo 12 parcelas");
}

// Pix → botão de gerar (sem clicar, para não criar cobrança).
await page.getByRole("button", { name: /^Pix$/i }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: join(SHOTS, "desktop-12-pix.png"), fullPage: true });
checar(await page.getByRole("button", { name: /gerar pix/i }).count() > 0, "Pix mostra botão de gerar");

checar(erros.length === 0, `sem erros de console (${erros.slice(0, 2).join(" | ") || "nenhum"})`);

await browser.close();
console.log(falhas.length === 0 ? "\nTUDO OK" : `\n${falhas.length} FALHA(S):\n- ${falhas.join("\n- ")}`);
process.exit(falhas.length === 0 ? 0 : 1);
