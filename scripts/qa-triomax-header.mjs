import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3013";
const outputDir = "docs/design-references/triomax-header";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

const results = [];

async function inspect(name, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1800);

  const header = page.locator("header#topo");
  const headerBox = await header.boundingBox();
  const marquee = page.locator('[role="marquee"]');
  const marqueeBox = await marquee.boundingBox();
  const topbarVisible = await page.getByText("Comprar pelo WhatsApp", { exact: true }).isVisible();
  const desktopNavVisible = await page.getByRole("navigation", { name: "Categorias de produtos", exact: true }).isVisible();
  const visibleSearchInputsBefore = await page.locator('input[type="search"]:visible').count();

  const expectedHeaderHeight = viewport.width < 768 ? 56 : viewport.width <= 1120 ? 151 : 157;
  if (!headerBox || Math.abs(headerBox.height - expectedHeaderHeight) > 2) {
    throw new Error(`${name}: altura do header ${headerBox?.height}, esperada ${expectedHeaderHeight}`);
  }
  if (visibleSearchInputsBefore !== 0) throw new Error(`${name}: input de busca visível antes de abrir a lupa`);
  if (viewport.width < 768 && topbarVisible) throw new Error(`${name}: topbar deveria estar oculta`);
  if (viewport.width >= 768 && !desktopNavVisible) throw new Error(`${name}: navegação desktop deveria estar visível`);

  await page.screenshot({
    path: `${outputDir}/${name}.png`,
    clip: { x: 0, y: 0, width: viewport.width, height: Math.min(520, viewport.height) },
  });

  const searchButton = page.locator('button[aria-label="Abrir busca"]:visible');
  await searchButton.click();
  const dialog = page.getByRole("dialog", { name: "Busca de produtos" });
  await dialog.waitFor({ state: "visible" });
  const input = dialog.locator('input[type="search"]');
  const inputIsFocused = await input.evaluate((element) => document.activeElement === element);
  if (!inputIsFocused) throw new Error(`${name}: busca não recebeu foco automático`);
  await page.screenshot({ path: `${outputDir}/${name}-search-open.png` });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });

  let drawerOpened = false;
  if (viewport.width < 768) {
    await page.locator('button[aria-label^="Abrir menu"]:visible').click();
    const drawer = page.locator("#mobile-category-drawer");
    await drawer.waitFor({ state: "visible" });
    drawerOpened = true;
    await page.screenshot({ path: `${outputDir}/${name}-menu-open.png` });
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "detached" });
  }

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  const scrolledBox = await header.boundingBox();
  const expectedTop = viewport.width < 768 ? 0 : -39;
  if (!scrolledBox || Math.abs(scrolledBox.y - expectedTop) > 2) {
    throw new Error(`${name}: posição sticky ${scrolledBox?.y}, esperada ${expectedTop}`);
  }

  results.push({
    name,
    viewport,
    header: headerBox,
    marquee: marqueeBox,
    topbarVisible,
    desktopNavVisible,
    drawerOpened,
    scrolledHeader: scrolledBox,
  });
  await context.close();
}

await inspect("desktop", { width: 1440, height: 900 });
await inspect("tablet", { width: 768, height: 900 });
await inspect("mobile", { width: 390, height: 844 });

await writeFile(`${outputDir}/qa-results.json`, `${JSON.stringify(results, null, 2)}\n`);
await browser.close();
console.log(`Triomax header QA passed: ${results.length} viewports`);
