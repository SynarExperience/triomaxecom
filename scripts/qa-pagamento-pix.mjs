/*
 * Gera um Pix de teste real pelo fluxo do site e consulta o status do pagamento
 * criado no Mercado Pago. Pix não tokeniza cartão, então roda em http local.
 *
 * Uso: node scripts/qa-pagamento-pix.mjs [porta]
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

let pixResp = null;
page.on("response", async (r) => {
  if (r.url().includes("/api/checkout/pix")) pixResp = { status: r.status(), body: await r.json().catch(() => null) };
});

const preencher = async (rot, val) => page.locator(`label:has-text("${rot}") input`).first().pressSequentially(val, { delay: 8 });

await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
await page.waitForTimeout(2000);
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
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

await page.getByRole("button", { name: /^Pix$/i }).first().click();
await page.waitForTimeout(600);
console.log("Gerando Pix de teste…");
await page.getByRole("button", { name: /gerar pix/i }).click();
await page.waitForTimeout(6000);

const temQr = await page.locator("[class*='pixQr']").count();
await page.screenshot({ path: join(SHOTS, "desktop-15-pix-gerado.png"), fullPage: true });

console.log("\n--- resposta /api/checkout/pix ---");
if (pixResp?.body) {
  const b = pixResp.body;
  console.log("payment id:", b.id, "| status:", b.status, "| total:", b.total);
  console.log("tem QR:", Boolean(b.pix?.qrCodeBase64), "| copia-e-cola:", b.pix?.qrCode?.slice(0, 30) + "…");
  console.log("QR renderizado na tela?", temQr > 0);

  // Consulta o status pelo nosso endpoint (fonte da verdade).
  const status = await page.evaluate(async (id) => {
    const r = await fetch(`/api/checkout/status?payment_id=${id}`);
    return r.json();
  }, b.id);
  console.log("\n--- /api/checkout/status ---");
  console.log(JSON.stringify(status));
} else {
  console.log("(sem resposta — falhou)");
}

await browser.close();
