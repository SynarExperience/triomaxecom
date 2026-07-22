/*
 * Reconhecimento do fluxo de checkout da Voolt3D (loja Nuvemshop/Tiendanube).
 *
 * Etapa 1: descobrir a topologia — home, PDP, carrinho e as telas de checkout.
 * Nada é comprado: o script para antes de qualquer confirmação de pedido.
 *
 * Uso: node scripts/inspect-voolt-checkout.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = join(import.meta.dirname, "..");
const RESEARCH = join(ROOT, "docs", "research", "voolt3d.com.br");
const SHOTS = join(ROOT, "docs", "design-references", "voolt3d.com.br");
mkdirSync(RESEARCH, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const SOURCE = "https://voolt3d.com.br/";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "pt-BR",
});
const page = await context.newPage();

const report = { steps: [] };

async function snap(name) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

// --- Home ---------------------------------------------------------------
await page.goto(SOURCE, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(5000);

report.home = await page.evaluate(() => ({
  title: document.title,
  url: location.href,
  platform: {
    tiendanube: Boolean(window.LS || document.querySelector("[data-store]")),
    storeId: window.LS?.store?.id ?? null,
    cartUrl: window.LS?.cart_url ?? null,
    theme: document.querySelector('meta[name="generator"]')?.content ?? null,
  },
  cartLinks: [...document.querySelectorAll('a[href*="carrinho"], a[href*="cart"], a[href*="checkout"]')]
    .map((a) => ({ href: a.href, text: a.textContent.trim().replace(/\s+/g, " ").slice(0, 60) }))
    .slice(0, 15),
  productLinks: [...new Set(
    [...document.querySelectorAll('a[href*="/produtos/"], a[href*="/products/"], .js-item-product a, .item-link')]
      .map((a) => a.href),
  )].slice(0, 10),
  scripts: [...document.querySelectorAll("script[src]")].map((s) => s.src).filter((s) => /checkout|cart|tiendanube|nuvemshop/i.test(s)).slice(0, 10),
}));
await snap("00-home");
report.steps.push("home ok");

writeFileSync(join(RESEARCH, "recon-step1.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
