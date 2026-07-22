/*
 * Descobre um produto da Voolt3D realmente em estoque. O tema `flex` mostra
 * "COMPRAR" mesmo esgotado; só o POST /comprar/ revela a verdade (403 +
 * `out_of_stock`). Percorre os `add_to_cart` das listagens e para no primeiro
 * que entra no carrinho.
 *
 * Uso: node scripts/find-voolt-in-stock.mjs
 */
import { chromium } from "playwright";

const LISTINGS = [
  "https://voolt3d.com.br/produtos/",
  "https://voolt3d.com.br/produtos/page/2/",
];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
const page = await context.newPage();

let found = null;

for (const listing of LISTINGS) {
  if (found) break;
  await page.goto(listing, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);

  const candidates = await page.evaluate(() =>
    [...document.querySelectorAll("form.js-product-form")].map((form) => ({
      id: form.querySelector("[name='add_to_cart']")?.value ?? null,
      name: form.closest(".js-item-product, .item")?.querySelector(".js-item-name, .item-name")?.innerText?.trim().replace(/\s+/g, " ")
        ?? form.closest("li, div")?.innerText?.trim().replace(/\s+/g, " ").slice(0, 60) ?? null,
    })).filter((c) => c.id),
  );
  console.log(`${listing}: ${candidates.length} candidatos`);

  for (const candidate of candidates) {
    const result = await page.evaluate(async (id) => {
      const response = await fetch("/comprar/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" },
        body: `add_to_cart=${id}&add_to_cart_enhanced=1`,
      });
      return { status: response.status, body: (await response.text()).slice(0, 200) };
    }, candidate.id);

    console.log(`  ${candidate.id} -> ${result.status} ${result.body.replace(/\s+/g, " ").slice(0, 120)}`);
    if (result.status === 200 && !/out_of_stock/.test(result.body)) {
      found = { ...candidate, result };
      console.log("EM ESTOQUE:", JSON.stringify(found).slice(0, 300));
      break;
    }
  }
}

if (!found) console.log("nenhum produto em estoque encontrado nas listagens varridas");
else {
  const badge = await page.evaluate(async () => {
    await fetch("/comprar/");
    return true;
  });
  console.log("carrinho populado:", badge);
}

await browser.close();
