/*
 * Testa se o 403 do POST /comprar/ é estoque real ou bloqueio de bot,
 * comparando Chrome headless x Chrome visível com user-agent de desktop.
 *
 * Uso: node scripts/probe-voolt-addtocart.mjs [headed]
 */
import { chromium } from "playwright";

const HEADED = process.argv[2] === "headed";
const PRODUCT_ID = "264614849";

const browser = await chromium.launch({
  headless: !HEADED,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "pt-BR",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
});
const page = await context.newPage();

await page.goto("https://voolt3d.com.br/produtos/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(6000);

const consent = page.getByRole("button", { name: /aceitar e fechar|aceitar/i }).first();
if (await consent.count()) await consent.click({ timeout: 5000 }).catch(() => undefined);
await page.waitForTimeout(2000);

const result = await page.evaluate(async (id) => {
  const response = await fetch("/comprar/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" },
    body: `add_to_cart=${id}&add_to_cart_enhanced=1`,
    credentials: "include",
  });
  return { status: response.status, body: (await response.text()).slice(0, 300) };
}, PRODUCT_ID);

console.log(HEADED ? "HEADED" : "HEADLESS", "->", JSON.stringify(result));

// Confere o carrinho de fato.
await page.goto("https://voolt3d.com.br/comprar/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(4000);
console.log("carrinho vazio?", await page.evaluate(() => /está vazio/i.test(document.body.innerText)));
console.log("badge:", await page.evaluate(() => document.querySelector(".js-cart-widget-amount")?.innerText ?? "?"));

await browser.close();
