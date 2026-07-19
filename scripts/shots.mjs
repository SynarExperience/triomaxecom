/**
 * Captura telas do site para conferência visual.
 *
 *   node scripts/shots.mjs [baseUrl] [outDir]
 *
 * Requer o servidor rodando (npm run dev). Salva um PNG por alvo listado em
 * TARGETS — página inteira, seções específicas e larguras de viewport.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const outDir = process.argv[3] ?? "docs/design-references/preview";

const TARGETS = [
  { name: "benefits", path: "/", selector: "section[aria-label='Vantagens da loja']" },
  { name: "produtos-home", path: "/", selector: "#colecao" },
  { name: "categorias", path: "/", selector: "#categorias" },
  { name: "footer", path: "/", selector: "footer" },
  { name: "listagem", path: "/produtos", fullPage: true },
  { name: "produto", path: "/produto/filamento-pla-branco", fullPage: true },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});

for (const target of TARGETS) {
  await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
  // No modo dev o CSS dos módulos pode chegar depois do networkidle; sem esta
  // espera a captura pega elementos ainda sem estilo (ícones em tamanho bruto).
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const file = `${outDir}/${target.name}.png`;
  if (target.selector) {
    const el = page.locator(target.selector).first();
    if ((await el.count()) === 0) {
      console.log(`  — ${target.name}: seletor não encontrado (${target.selector})`);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: Boolean(target.fullPage) });
  }
  console.log(`  ✓ ${file}`);
}

await browser.close();
