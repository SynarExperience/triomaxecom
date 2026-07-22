/*
 * Diagnóstico do formulário de compra da PDP da Voolt3D: quantos botões
 * `.js-addtocart` existem, quais estão visíveis, e que variações precisam ser
 * escolhidas antes de adicionar ao carrinho.
 *
 * Uso: node scripts/inspect-voolt-pdp-form.mjs
 */
import { chromium } from "playwright";

const PDP = "https://voolt3d.com.br/produtos/filamento-pla-azul-sky-v-silk-premium/";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
await page.goto(PDP, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(6000);

const diagnosis = await page.evaluate(() => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    addToCartButtons: [...document.querySelectorAll(".js-addtocart")].map((el) => ({
      value: el.value || el.innerText,
      classes: String(el.className).trim().replace(/\s+/g, " "),
      box: box(el),
      formAction: el.closest("form")?.getAttribute("action") ?? null,
      formId: el.closest("form")?.id ?? null,
      parentHidden: (() => {
        let node = el;
        while (node && node !== document.body) {
          const s = getComputedStyle(node);
          if (s.display === "none" || s.visibility === "hidden") {
            return String(node.className).trim().replace(/\s+/g, " ").slice(0, 80);
          }
          node = node.parentElement;
        }
        return null;
      })(),
    })),
    forms: [...document.querySelectorAll("form")].filter((f) => /cart|comprar/i.test(f.action)).map((f) => ({
      action: f.action,
      method: f.method,
      id: f.id,
      classes: String(f.className).trim().replace(/\s+/g, " "),
      fields: [...f.querySelectorAll("input, select")].map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type,
        name: el.name,
        value: el.value?.slice(0, 40),
        options: el.tagName === "SELECT" ? [...el.options].map((o) => `${o.value}:${o.text}`).slice(0, 10) : undefined,
      })),
    })),
    variantPickers: [...document.querySelectorAll(".js-variation-option, .js-insta-variants, [name^='variation']")].map((el) => ({
      tag: el.tagName.toLowerCase(),
      name: el.name || null,
      classes: String(el.className).trim().replace(/\s+/g, " ").slice(0, 80),
    })).slice(0, 10),
    cartCount: document.querySelector(".js-cart-widget-amount, [class*='cart-widget']")?.innerText?.trim() ?? null,
  };
});

console.log(JSON.stringify(diagnosis, null, 2));
await browser.close();
