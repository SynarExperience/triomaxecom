/*
 * Teste E2E do Pix em produção: gera o Pix pela loja, confirma que o pedido foi
 * gravado como `pendente`, e mostra o código copia-e-cola para pagamento manual.
 * NÃO paga — quem paga é você no app do banco. Depois o webhook vira o status.
 *
 * Uso: node scripts/qa-pix-prod-e2e.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://triomaxoficial.com.br";
const OUT = "/private/tmp/claude-501/-Users-qgdaimportacao-fusionx-hero-preview/91be5240-fb08-4a59-b771-ae8dd5d496a6/scratchpad";
mkdirSync(OUT, { recursive: true });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });

let pixResp = null;
page.on("response", async (r) => {
  if (r.url().includes("/api/checkout/pix")) pixResp = await r.json().catch(() => null);
});

const preencher = async (rot, val) => page.locator(`label:has-text("${rot}") input`).first().pressSequentially(val, { delay: 8 });

// Adiciona pela listagem (fluxo comprovado). Tenta o mais barato pelo aria-label;
// se não achar, cai no primeiro card.
await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
const barato = page.getByRole("button", { name: /adicionar.*duplicado ao carrinho/i }).first();
if (await barato.count()) await barato.click();
else await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
await page.waitForTimeout(2000);
await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
if (page.url().includes("/carrinho")) { console.log("sacola vazia — abortando"); await browser.close(); process.exit(1); }
await page.locator("input[type='email']").first().pressSequentially("teste@triomax.com.br", { delay: 6 });
await page.locator("input[inputmode='numeric']").first().pressSequentially("01310100", { delay: 6 });
await page.getByRole("button", { name: /^continuar$/i }).click();
await page.waitForTimeout(9000);
await page.getByText(/chega em .* dias? úte/i).first().click({ timeout: 25000 });
await page.waitForTimeout(600);
await preencher("Nome", "Teste"); await preencher("Sobrenome", "Producao");
await preencher("Telefone com DDD", "11987654321"); await preencher("Número", "1000");
await preencher("CPF ou CNPJ", "12345678909");
await page.getByRole("button", { name: /continuar para pagamento/i }).click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^Pix$/i }).first().click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /gerar pix/i }).click();
await page.waitForTimeout(7000);

if (!pixResp?.id) { console.log("Falha ao gerar o Pix:", JSON.stringify(pixResp)); await browser.close(); process.exit(1); }

console.log("PIX gerado em produção");
console.log("  payment id:", pixResp.id);
console.log("  total: R$", pixResp.total);

// Salva o QR como imagem para você escanear.
if (pixResp.pix?.qrCodeBase64) {
  const qrPath = join(OUT, "pix-qr.png");
  writeFileSync(qrPath, Buffer.from(pixResp.pix.qrCodeBase64, "base64"));
  console.log("  QR salvo em:", qrPath);
}
console.log("\n  COPIA-E-COLA (cole no app do banco):");
console.log("  " + pixResp.pix?.qrCode);

// Confirma que o pedido foi gravado.
await new Promise((r) => setTimeout(r, 2000));
const { data: pedido } = await sb
  .from("pedidos")
  .select("id, numero, status_pagamento, pagamento_id, total")
  .eq("pagamento_id", String(pixResp.id))
  .maybeSingle();

console.log("\n--- pedido no banco ---");
console.log(pedido ? `  #${pedido.numero} | status: ${pedido.status_pagamento} | total: R$ ${pedido.total}` : "  (não encontrado ainda)");

await browser.close();
