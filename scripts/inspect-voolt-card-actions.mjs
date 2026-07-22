/*
 * Compara os dois botões do card da Voolt3D: o "COMPRAR" largo e o quadradinho
 * com ícone de carrinho. Interessa saber se levam a lugares diferentes.
 *
 * Uso: node scripts/inspect-voolt-card-actions.mjs
 */
import { chromium } from "playwright";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

async function testar(qual) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", userAgent: UA });
  const page = await context.newPage();
  await page.goto("https://voolt3d.com.br/produtos/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(6000);

  const consent = page.getByRole("button", { name: /aceitar e fechar|aceitar/i }).first();
  if (await consent.count()) await consent.click({ timeout: 5000 }).catch(() => undefined);

  // Estrutura do primeiro card: quais elementos acionáveis ele tem.
  if (qual === "estrutura") {
    const card = await page.evaluate(() => {
      const form = document.querySelector("form.js-product-form");
      const item = form?.closest("li, .js-item-product, .item");
      if (!item) return null;
      return [...item.querySelectorAll("a, button, input[type=submit]")].map((el) => ({
        tag: el.tagName.toLowerCase(),
        texto: (el.innerText || el.value || "").trim().replace(/\s+/g, " ").slice(0, 40),
        classes: String(el.className).trim().replace(/\s+/g, " ").slice(0, 90),
        href: el.getAttribute("href"),
        box: (({ width, height }) => ({ w: Math.round(width), h: Math.round(height) }))(el.getBoundingClientRect()),
      })).filter((el) => el.box.w > 0);
    });
    console.log("estrutura do card:", JSON.stringify(card, null, 2));
    await context.close();
    return;
  }

  const urlAntes = page.url();
  const alvo = qual === "largo"
    ? page.locator("form.js-product-form").first().locator(".js-addtocart").locator("visible=true").first()
    : page.locator(".js-addtocart").locator("visible=true").first();

  await alvo.scrollIntoViewIfNeeded();
  console.log(`\n[${qual}] valor do botão:`, await alvo.evaluate((el) => el.value || el.innerText));
  await alvo.click({ timeout: 15000 }).catch((e) => console.log("erro:", String(e).slice(0, 100)));
  await page.waitForTimeout(7000);

  console.log(`[${qual}] navegou?`, page.url() !== urlAntes, "->", page.url());
  console.log(`[${qual}] badge do carrinho:`, await page.evaluate(() =>
    document.querySelector(".js-cart-widget-amount")?.innerText?.trim() ?? "?"));
  console.log(`[${qual}] notificação visível?`, await page.evaluate(() => {
    const nota = document.querySelector(".js-alert-added-to-cart");
    if (!nota) return false;
    return !nota.className.includes("notification-hidden");
  }));

  await context.close();
}

await testar("estrutura");
await testar("largo");
await browser.close();
