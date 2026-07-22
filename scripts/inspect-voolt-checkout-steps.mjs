/*
 * Percorre as etapas 2 (Entrega) e 3 (Pagamento) do checkout da Voolt3D,
 * capturando tela, DOM e estilos computados de cada uma.
 *
 * Usa e-mail descartável e endereço público (Av. Paulista). O script PARA na
 * tela de pagamento: nunca escolhe meio de pagamento nem confirma pedido.
 *
 * Uso: node scripts/inspect-voolt-checkout-steps.mjs [desktop|mobile]
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
const USER_AGENT = MODE === "mobile"
  ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
  : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

// O CPF vem de env (VOOLT_CPF) de propósito: é dado pessoal e não deve ficar
// versionado no repositório.
const FIXTURE = {
  email: "teste-clone@example.com",
  cep: "01310-100",
  nome: "Teste",
  sobrenome: "Clone",
  numero: "1000",
  telefone: "11950399547",
  cpf: process.env.VOOLT_CPF ?? "",
};

const STYLE_PROPS = [
  "display", "flexDirection", "gridTemplateColumns", "justifyContent", "alignItems", "gap",
  "width", "maxWidth", "height", "padding", "margin", "position", "top", "zIndex",
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform",
  "color", "backgroundColor", "border", "borderRadius", "boxShadow", "opacity", "transition",
];

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: VIEWPORT, locale: "pt-BR", userAgent: USER_AGENT,
  isMobile: MODE === "mobile", hasTouch: MODE === "mobile",
});
const page = await context.newPage();

const captures = {};

async function snap(name) {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(SHOTS, `${MODE}-${name}.png`), fullPage: true }).catch(() => undefined);
}

/** Fotografa estrutura + estilos computados da etapa atual do checkout. */
async function capture(name) {
  await snap(name);
  const data = await page.evaluate((props) => {
    const styles = (el) => {
      const cs = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, cs[p]]).filter(([, v]) => v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px"));
    };
    const describe = (el) => el && ({
      tag: el.tagName.toLowerCase(),
      classes: String(el.className || "").trim().replace(/\s+/g, " ").slice(0, 100),
      styles: styles(el),
    });
    return {
      url: location.href,
      title: document.title,
      stepper: [...document.querySelectorAll("[class*='step'], [class*='breadcrumb']")]
        .map((el) => el.innerText.trim().replace(/\s+/g, " ").slice(0, 80)).filter(Boolean).slice(0, 5),
      headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => ({
        text: h.innerText.trim().replace(/\s+/g, " "), styles: styles(h),
      })).filter((h) => h.text).slice(0, 15),
      fields: [...document.querySelectorAll("input, select, textarea")].map((el) => ({
        type: el.type || el.tagName.toLowerCase(), name: el.name || null, id: el.id || null,
        placeholder: el.placeholder || null,
        label: el.labels?.[0]?.innerText?.trim().replace(/\s+/g, " ") ?? null,
        styles: styles(el),
      })).slice(0, 30),
      buttons: [...document.querySelectorAll("button, input[type='submit'], a[role='button']")]
        .filter((b) => b.getBoundingClientRect().width > 0)
        .map((b) => ({ text: (b.innerText || b.value || "").trim().replace(/\s+/g, " "), styles: styles(b) }))
        .filter((b) => b.text).slice(0, 12),
      shippingOptions: [...document.querySelectorAll("[class*='shipping'], [name*='shipping'], [class*='frete']")]
        .map((el) => el.innerText?.trim().replace(/\s+/g, " ").slice(0, 160)).filter(Boolean).slice(0, 10),
      summary: describe(document.querySelector("[class*='summary'], [class*='resumo'], aside")),
      bodyText: document.body.innerText.replace(/\s+/g, " ").slice(0, 2500),
    };
  }, STYLE_PROPS);
  captures[name] = data;
  console.log(`\n=== ${name} ===`);
  console.log("url:", data.url, "| title:", data.title);
  console.log("headings:", data.headings.map((h) => h.text).join(" | "));
  console.log("fields:", data.fields.map((f) => f.name || f.placeholder || f.type).join(", "));
  console.log("buttons:", data.buttons.map((b) => b.text).join(" | "));
  if (data.shippingOptions.length) console.log("frete:", data.shippingOptions.slice(0, 4).join(" // "));
  return data;
}

/**
 * Preenche o primeiro campo que casar. O checkout é React controlado: `fill()`
 * seta o valor sem disparar os eventos que ele escuta, e o campo continua
 * "vazio" para a validação. Digitamos tecla a tecla.
 */
async function fill(selectors, value) {
  for (const selector of selectors) {
    const field = page.locator(selector).locator("visible=true").first();
    if (await field.count()) {
      await field.click({ timeout: 8000 }).catch(() => undefined);
      await field.pressSequentially(value, { delay: 45, timeout: 20000 }).catch(() => undefined);
      await field.blur().catch(() => undefined);
      await page.waitForTimeout(400);
      return true;
    }
  }
  return false;
}

async function advance(label) {
  const before = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));
  const button = page
    .getByRole("button", { name: /continuar para pagamento|continuar|finalizar compra/i })
    .locator("visible=true").first();
  if (!(await button.count())) { console.log(`(sem botão de avanço em ${label})`); return false; }
  const text = await button.innerText().catch(() => "?");
  await button.scrollIntoViewIfNeeded().catch(() => undefined);
  await button.click({ timeout: 15000 }).catch((e) => console.log("erro avanço:", String(e).slice(0, 120)));
  await page.waitForTimeout(8000);
  const after = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));
  console.log(`avanço ${label} via "${text.trim()}" -> mudou? ${before !== after}`);
  return before !== after;
}

// --- Monta o carrinho e entra no checkout -------------------------------
await page.goto("https://voolt3d.com.br/produtos/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(5000);
const consent = page.getByRole("button", { name: /aceitar e fechar|aceitar/i }).first();
if (await consent.count()) await consent.click({ timeout: 5000 }).catch(() => undefined);

await page.locator(".js-addtocart").locator("visible=true").first().click({ timeout: 15000 });
await page.waitForTimeout(5000);
await page.goto("https://voolt3d.com.br/comprar/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(4000);
await page.locator("input[name='go_to_checkout'], button[name='go_to_checkout']").locator("visible=true").first()
  .click({ timeout: 20000 });
await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => undefined);
await page.waitForTimeout(9000);

// --- Etapa 1: dados de contato + CEP ------------------------------------
await capture("10-checkout-contato");
await fill(["input[type='email']", "input[name*='email']", "input[placeholder*='mail']"], FIXTURE.email);
await fill(["input[name*='zipcode']", "input[name*='cep']", "input[placeholder*='CEP']"], FIXTURE.cep);
await page.waitForTimeout(4000);
await capture("11-checkout-contato-preenchido");
await advance("contato");

// --- Etapa 2: escolha do frete -------------------------------------------
await capture("20-checkout-frete");
// As opções são linhas clicáveis com input escondido — clicamos no texto.
const shipping = page.getByText(/Mandaê: Econômico/i).first();
if (await shipping.count()) {
  await shipping.click({ timeout: 10000 }).catch((e) => console.log("erro frete:", String(e).slice(0, 120)));
  await page.waitForTimeout(4000);
  console.log("frete marcado?", await page.evaluate(() =>
    [...document.querySelectorAll("input[type='radio']")].map((r) => r.checked).join(",")));
}
await capture("21-checkout-frete-escolhido");
await advance("frete");

// --- Etapa 3: endereço ----------------------------------------------------
await capture("30-checkout-endereco");
await fill(["input[name*='first_name']", "input[name*='firstName']", "input[placeholder*='Nome']"], FIXTURE.nome);
await fill(["input[name*='last_name']", "input[name*='lastName']", "input[placeholder*='Sobrenome']"], FIXTURE.sobrenome);
await fill(["input[name*='number']", "input[placeholder*='Número']"], FIXTURE.numero);
await fill(["input[type='tel']", "input[name*='phone']"], FIXTURE.telefone);
if (FIXTURE.cpf) {
  await fill(["input[name*='id_number']", "input[placeholder*='CPF']"], FIXTURE.cpf);
} else {
  console.log("(sem VOOLT_CPF: a etapa de pagamento não será alcançada)");
}
await page.waitForTimeout(3000);
await capture("31-checkout-endereco-preenchido");
await advance("endereço");

// --- Etapa 4: pagamento (somente leitura) --------------------------------
await capture("40-checkout-pagamento");
console.log("\nPARADO na tela de pagamento — nenhum pedido confirmado.");

writeFileSync(join(RESEARCH, `checkout-steps-${MODE}.json`), JSON.stringify(captures, null, 2));
console.log("OK ->", join(RESEARCH, `checkout-steps-${MODE}.json`));
await browser.close();
