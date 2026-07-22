/*
 * Garante que nenhum campo do site dispare o auto-zoom do Safari no iOS.
 *
 * O gatilho é `font-size` computado abaixo de 16px num campo focável, em
 * aparelho de toque. Emulamos iPhone (`hasTouch` liga `pointer: coarse`) e
 * medimos o valor real depois do CSS aplicado.
 *
 * Uso: node scripts/qa-zoom-ios.mjs [porta]
 */
import { chromium } from "playwright";

const PORTA = process.argv[2] ?? "3210";
const BASE = `http://localhost:${PORTA}`;

const ROTAS = ["/", "/produtos", "/carrinho", "/checkout"];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  locale: "pt-BR",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();

const pequenos = [];

/** Mede todo campo visível da tela atual. */
async function medir(rotulo) {
  const campos = await page.evaluate(() =>
    [...document.querySelectorAll("input, select, textarea")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.type !== "checkbox" && el.type !== "radio";
      })
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        nome: el.name || el.placeholder || el.getAttribute("aria-label") || "(sem nome)",
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
      })),
  );

  for (const campo of campos) {
    const ok = campo.fontSize >= 16;
    if (!ok) pequenos.push(`${rotulo}: ${campo.nome} (${campo.fontSize}px)`);
    console.log(`  ${ok ? "ok  " : "ZOOM"} ${rotulo} · ${campo.nome} · ${campo.fontSize}px`);
  }
  if (campos.length === 0) console.log(`  --   ${rotulo}: nenhum campo visível`);
}

for (const rota of ROTAS) {
  console.log(`\n=== ${rota} ===`);
  await page.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // /checkout redireciona para /carrinho com a sacola vazia: enche antes.
  if (rota === "/checkout" && page.url().includes("/carrinho")) {
    await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
  }

  await medir(rota);

  // No checkout, a etapa de entrega traz a maior parte dos campos.
  if (rota === "/checkout") {
    await page.locator("input[type='email']").first().pressSequentially("cliente@teste.com", { delay: 10 });
    await page.locator("input[inputmode='numeric']").first().pressSequentially("01310100", { delay: 10 });
    await page.getByRole("button", { name: /^continuar$/i }).click();
    await page.waitForTimeout(3500);
    await medir("/checkout (entrega)");
  }
}

// A gaveta da sacola tem formulário próprio, fora do fluxo das rotas.
console.log("\n=== gaveta da sacola ===");
await page.goto(`${BASE}/produtos`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first().click();
await page.waitForTimeout(1000);
await page.locator("[aria-label='Abrir sacola'], [aria-label*='sacola']").first().click().catch(() => undefined);
await page.waitForTimeout(900);
await page.getByRole("button", { name: /whatsapp/i }).first().click().catch(() => undefined);
await page.waitForTimeout(900);
await medir("gaveta");

await browser.close();

console.log(
  pequenos.length === 0
    ? "\nOK — nenhum campo abaixo de 16px, o iOS não vai dar zoom."
    : `\n${pequenos.length} CAMPO(S) AINDA DISPARAM ZOOM:\n- ${pequenos.join("\n- ")}`,
);
process.exit(pequenos.length === 0 ? 0 : 1);
