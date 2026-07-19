import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3013";
const outputDir = "docs/design-references/category-showcase";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const section = page.locator("#categorias");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const cards = section.locator("a");
  if ((await cards.count()) !== 2) throw new Error(`${viewport.name}: quantidade incorreta de categorias`);

  const imageWidths = await section.locator("img").evaluateAll((images) =>
    images.map((image) => image.naturalWidth),
  );
  if (imageWidths.some((width) => width !== 390)) {
    throw new Error(`${viewport.name}: banners não carregaram corretamente (${imageWidths.join(", ")})`);
  }

  const hrefs = await cards.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  if (hrefs.some((href) => href !== "/produtos")) {
    throw new Error(`${viewport.name}: destinos das categorias estão incorretos`);
  }

  await section.screenshot({ path: `${outputDir}/${viewport.name}.png` });
  results.push({ viewport, hrefs, imageWidths });
  await context.close();
}

await writeFile(`${outputDir}/qa-results.json`, `${JSON.stringify(results, null, 2)}\n`);
await browser.close();
console.log("Category showcase QA passed");
