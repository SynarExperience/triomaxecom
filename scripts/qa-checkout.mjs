/*
 * QA do fluxo de checkout da Triomax: percorre produto → sacola → carrinho →
 * contato → entrega → pagamento → confirmação, capturando cada tela em desktop
 * e celular.
 *
 * Uso: node scripts/qa-checkout.mjs [porta]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = join(import.meta.dirname, "..");
const SHOTS = join(ROOT, "docs", "design-references", "triomax-checkout");
mkdirSync(SHOTS, { recursive: true });

const PORTA = process.argv[2] ?? "3210";
const BASE = `http://localhost:${PORTA}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

const falhas = [];
const checar = (condicao, mensagem) => {
  if (!condicao) falhas.push(mensagem);
  console.log(condicao ? "  ok  " : "  FALHA", mensagem);
};

for (const [modo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  console.log(`\n=== ${modo} ===`);
  const context = await browser.newContext({ viewport, locale: "pt-BR", isMobile: modo === "mobile" });
  const page = await context.newPage();
  const erros = [];
  page.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => erros.push(`pageerror: ${String(e).slice(0, 160)}`));

  const snap = async (nome) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(SHOTS, `${modo}-${nome}.png`), fullPage: true });
  };

  // 1. Card da vitrine: "Comprar" leva ao produto, o quadrado adiciona.
  await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
  const comprar = page.getByRole("link", { name: /^comprar$/i }).first();
  checar(/\/produto\//.test(await comprar.getAttribute("href") ?? ""), "\"Comprar\" do card aponta para a PDP");

  await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
  await page.waitForTimeout(1500);
  await snap("01-toast");
  checar(await page.getByText(/adicionado ao carrinho/i).count() > 0, "aviso flutuante aparece");
  checar(await page.locator("[aria-label='Fechar sacola']").count() === 0, "gaveta NÃO abre ao adicionar");

  // 2. PDP também adiciona sem abrir a gaveta.
  await page.locator("a[href^='/produto/']").first().click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).first().click();
  await page.waitForTimeout(1200);
  await snap("02-pdp-adicionado");
  checar(await page.locator("[aria-label='Fechar sacola']").count() === 0, "PDP também não abre a gaveta");

  // 3. Carrinho
  await page.goto(`${BASE}/carrinho`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await snap("03-carrinho");
  checar(!(await page.getByText(/sua sacola está vazia/i).count()), "carrinho manteve o item");
  checar(await page.getByText(/quem comprou levou também/i).count() > 0, "carrinho mostra sugestões");

  // 4. Checkout — contato
  await page.getByRole("link", { name: /finalizar compra/i }).first().click();
  await page.waitForURL("**/checkout", { timeout: 20000 });
  await page.waitForTimeout(900);
  await snap("04-contato");
  checar(await page.getByText("Dados de contato").count() > 0, "checkout abre em Dados de contato");

  // Validação: continuar vazio precisa reclamar.
  await page.getByRole("button", { name: /^continuar$/i }).click();
  await page.waitForTimeout(600);
  checar(await page.getByText(/digite um e-mail válido/i).count() > 0, "e-mail vazio é barrado");
  await snap("05-validacao");

  await page.getByLabel(/e-mail/i).or(page.locator("input[type='email']")).first()
    .pressSequentially("cliente@teste.com", { delay: 12 });
  await page.locator("input[inputmode='numeric']").first().pressSequentially("01310100", { delay: 12 });
  await page.getByRole("button", { name: /^continuar$/i }).click();
  await page.waitForTimeout(3500);
  await snap("06-entrega");
  checar(await page.getByText(/dados para entrega/i).count() > 0, "CEP revelou a etapa de entrega");
  checar(await page.getByText(/são paulo/i).count() > 0, "endereço veio do CEP");

  // 5. Entrega
  await page.getByRole("button", { name: /PAC Econômico/i }).first().click();
  await page.waitForTimeout(600);
  const preencher = async (rotulo, valor) => {
    const campo = page.locator(`label:has-text("${rotulo}") input`).first();
    await campo.pressSequentially(valor, { delay: 12 });
  };
  await preencher("Nome", "Ana");
  await preencher("Sobrenome", "Souza");
  await preencher("Telefone com DDD", "11987654321");
  await preencher("Número", "1000");
  // CPF de teste clássico: dígitos verificadores válidos, sequência conhecida.
  await preencher("CPF ou CNPJ", "12345678909");
  await page.waitForTimeout(500);
  await snap("07-entrega-preenchida");

  await page.getByRole("button", { name: /continuar para pagamento/i }).click();
  await page.waitForTimeout(1500);
  await snap("08-pagamento");
  checar(await page.getByText(/forma de pagamento/i).count() > 0, "avançou para pagamento");
  checar(await page.getByRole("button", { name: /^Pix\b/ }).count() > 0, "oferece Pix");

  // 6. Pagamento → pedido
  await page.getByRole("button", { name: /^Pix\b/ }).first().click();
  await page.waitForTimeout(500);
  await snap("09-pix");
  await page.getByRole("button", { name: /fazer pedido/i }).click();
  await page.waitForURL("**/checkout/confirmacao", { timeout: 20000 });
  await page.waitForTimeout(1200);
  await snap("10-confirmacao");
  checar(await page.getByText(/pedido confirmado/i).count() > 0, "confirmação exibida");
  checar(await page.getByText(/TX20/i).count() > 0, "número do pedido gerado");

  checar(erros.length === 0, `sem erros de console (${erros.slice(0, 3).join(" | ") || "nenhum"})`);
  await context.close();
}

await browser.close();
console.log(falhas.length === 0 ? "\nTUDO OK" : `\n${falhas.length} FALHA(S):\n- ${falhas.join("\n- ")}`);
process.exit(falhas.length === 0 ? 0 : 1);
