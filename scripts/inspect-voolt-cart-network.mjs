/*
 * Depura o "adicionar ao carrinho" da Voolt3D observando a rede: qual request
 * o tema dispara, o que ele responde e se o cookie de carrinho é gravado.
 *
 * Uso: node scripts/inspect-voolt-cart-network.mjs
 */
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
const page = await context.newPage();

const traffic = [];
page.on("request", (request) => {
  if (/cart|comprar|checkout/i.test(request.url())) {
    traffic.push({ dir: ">>", method: request.method(), url: request.url().slice(0, 140), post: request.postData()?.slice(0, 200) ?? null });
  }
});
page.on("response", async (response) => {
  if (/cart|comprar|checkout/i.test(response.url())) {
    let body = null;
    try { body = (await response.text()).slice(0, 300); } catch { /* binário ou redirect */ }
    traffic.push({ dir: "<<", status: response.status(), url: response.url().slice(0, 140), body });
  }
});
page.on("console", (message) => {
  if (message.type() === "error") traffic.push({ dir: "!!", console: message.text().slice(0, 200) });
});

await page.goto("https://voolt3d.com.br/produtos/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(6000);

// Aceita cookies — o banner pode bloquear a gravação do carrinho.
const consent = page.getByRole("button", { name: /aceitar e fechar|aceitar/i }).first();
if (await consent.count()) {
  await consent.click({ timeout: 5000 }).catch(() => undefined);
  console.log("cookies aceitos");
}
await page.waitForTimeout(1500);

const button = page.locator(".js-addtocart").locator("visible=true").first();
const info = await button.evaluate((el) => ({
  value: el.value,
  form: el.closest("form")?.className ?? null,
  addToCart: el.closest("form")?.querySelector("[name='add_to_cart']")?.value ?? null,
}));
console.log("botão alvo:", JSON.stringify(info));

await button.scrollIntoViewIfNeeded();
await button.click({ timeout: 15000 });
await page.waitForTimeout(9000);

console.log("\n--- tráfego ---");
for (const entry of traffic) console.log(JSON.stringify(entry));

const cookies = await context.cookies();
console.log("\n--- cookies de carrinho ---");
console.log(cookies.filter((c) => /cart|carrinho|session/i.test(c.name)).map((c) => `${c.name}=${c.value.slice(0, 40)}`).join("\n") || "(nenhum)");

console.log("\nurl final:", page.url());
console.log("badge:", await page.evaluate(() => document.querySelector(".js-cart-widget-amount")?.innerText ?? "?"));

await browser.close();
