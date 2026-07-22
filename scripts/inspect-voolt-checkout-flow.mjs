/*
 * Percorre o funil de compra da Voolt3D (Nuvemshop, tema flex) capturando cada
 * tela: PDP -> adicionar ao carrinho -> carrinho -> checkout (contato, entrega,
 * pagamento). O script NUNCA confirma pedido nem envia dados de pagamento.
 *
 * Uso: node scripts/inspect-voolt-checkout-flow.mjs [desktop|mobile]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = join(import.meta.dirname, "..");
const RESEARCH = join(ROOT, "docs", "research", "voolt3d.com.br");
const SHOTS = join(ROOT, "docs", "design-references", "voolt3d.com.br");
mkdirSync(RESEARCH, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const MODE = process.argv[2] === "mobile" ? "mobile" : "desktop";
const VIEWPORT = MODE === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 };
// Partimos da listagem: os cards só expõem "COMPRAR" quando há estoque, o que
// evita cair numa PDP esgotada (várias cores V-Silk estão fora de estoque).
const LISTING = "https://voolt3d.com.br/produtos/";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
// Sem user-agent de browser real a Nuvemshop devolve 403 em /comprar/ — o tema
// traduz isso para "out_of_stock" e o carrinho nunca popula.
const USER_AGENT = MODE === "mobile"
  ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
  : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const context = await browser.newContext({
  viewport: VIEWPORT,
  locale: "pt-BR",
  userAgent: USER_AGENT,
  isMobile: MODE === "mobile",
  hasTouch: MODE === "mobile",
});
const page = await context.newPage();

const log = [];
const note = (message, data) => {
  log.push({ message, data });
  console.log("•", message, data ? JSON.stringify(data).slice(0, 300) : "");
};

async function snap(name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(SHOTS, `${MODE}-${name}.png`), fullPage: true }).catch(() => undefined);
}

/** Lista tudo que parece acionável, para descobrir seletores sem adivinhar. */
async function actionables() {
  return page.evaluate(() =>
    [...document.querySelectorAll('button, a, input[type="submit"], [role="button"]')]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.value || "").trim().replace(/\s+/g, " ").slice(0, 70),
        classes: String(el.className || "").trim().replace(/\s+/g, " ").slice(0, 90),
        href: el.getAttribute("href"),
        visible: el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0,
      }))
      .filter((el) => el.visible && el.text)
      .slice(0, 60),
  );
}

// --- 1. Listagem --------------------------------------------------------
await page.goto(LISTING, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(6000);
const consent = page.getByRole("button", { name: /aceitar e fechar|aceitar/i }).first();
if (await consent.count()) await consent.click({ timeout: 5000 }).catch(() => undefined);
await page.waitForTimeout(1500);
await snap("01-listing");
note("listing url", { url: page.url() });

// --- 2. Adicionar ao carrinho -------------------------------------------
// Overlays de apps (chat, cupom, avaliações) interceptam o ponteiro no tema
// flex, então o clique real falha. Vamos removê-los antes e, se ainda assim
// falhar, submeter o form direto pelo DOM.
await page.evaluate(() => {
  for (const el of document.querySelectorAll("iframe, [class*='widget'], [id*='widget'], [class*='chat'], [id*='chat']")) {
    const style = getComputedStyle(el);
    if (style.position === "fixed") el.remove();
  }
});

// Cards em estoque expõem `.js-addtocart` visível; os esgotados não.
const addToCart = page.locator(".js-addtocart").locator("visible=true").first();
let added = false;
if (await addToCart.count()) {
  await addToCart.scrollIntoViewIfNeeded().catch(() => undefined);
  await addToCart.click({ timeout: 15000 }).then(() => { added = true; })
    .catch((error) => note("addToCart clique erro", { error: String(error).slice(0, 160) }));
}
note("clicou adicionar ao carrinho", { added });
await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => undefined);
await page.waitForTimeout(4000);
await snap("02-cart-drawer");
note("apos add url", { url: page.url() });

// Estrutura do drawer/modal de carrinho, se existir.
const cartDrawer = await page.evaluate(() => {
  const candidates = [...document.querySelectorAll('[class*="cart"], [id*="cart"]')].filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 200 && rect.height > 200 && style.visibility !== "hidden" && style.display !== "none";
  });
  return candidates.slice(0, 6).map((el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: String(el.className || "").trim().replace(/\s+/g, " ").slice(0, 120),
    rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()),
    text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 400),
  }));
});
note("cart drawer candidatos", cartDrawer.map((c) => ({ classes: c.classes, rect: c.rect })));

// --- 3. Página de carrinho ----------------------------------------------
if (!page.url().includes("/comprar/")) {
  await page.goto("https://voolt3d.com.br/comprar/", { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => undefined);
}
await page.waitForTimeout(5000);
await snap("03-cart-page");
const cartState = await page.evaluate(() => ({
  url: location.href,
  empty: /carrinho de compras está vazio/i.test(document.body.innerText),
  badge: document.querySelector(".js-cart-widget-amount")?.innerText?.trim() ?? null,
  text: document.querySelector(".template-cart, .page--cart, main")?.innerText?.replace(/\s+/g, " ").slice(0, 1200) ?? null,
}));
note("cart page", cartState);

// --- 4. Checkout --------------------------------------------------------
// O botão de checkout é `input[name=go_to_checkout]` ("Finalizar Compra").
const checkoutButton = page.locator("input[name='go_to_checkout'], button[name='go_to_checkout']").locator("visible=true").first();
note("checkout button encontrado", { count: await checkoutButton.count() });
if (await checkoutButton.count()) {
  await checkoutButton.scrollIntoViewIfNeeded().catch(() => undefined);
  await checkoutButton.click({ timeout: 20000 }).catch((error) => note("checkout click erro", { error: String(error).slice(0, 160) }));
  await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => undefined);
  await page.waitForTimeout(9000);
}
await snap("04-checkout-step1");
note("checkout", { url: page.url(), title: await page.title() });

const checkoutShape = await page.evaluate(() => ({
  url: location.href,
  headings: [...document.querySelectorAll("h1, h2, h3")].map((h) => h.innerText.trim().replace(/\s+/g, " ")).filter(Boolean).slice(0, 20),
  inputs: [...document.querySelectorAll("input, select, textarea")].map((el) => ({
    tag: el.tagName.toLowerCase(),
    type: el.type || null,
    name: el.name || null,
    id: el.id || null,
    placeholder: el.placeholder || null,
    label: el.labels?.[0]?.innerText?.trim().replace(/\s+/g, " ") ?? null,
  })).slice(0, 40),
  buttons: [...document.querySelectorAll("button, a[role='button']")].map((b) => b.innerText.trim().replace(/\s+/g, " ")).filter(Boolean).slice(0, 20),
  bodyText: document.body.innerText.replace(/\s+/g, " ").slice(0, 2000),
}));
note("checkout shape", { url: checkoutShape.url, headings: checkoutShape.headings, inputs: checkoutShape.inputs.length });

writeFileSync(join(RESEARCH, `flow-${MODE}.json`), JSON.stringify({ log, cartDrawer, checkoutShape }, null, 2));
await browser.close();
console.log("\nOK ->", join(RESEARCH, `flow-${MODE}.json`));
