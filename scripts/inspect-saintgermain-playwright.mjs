import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

const source = "https://www.saintgermainbrand.com.br/";
const output = "docs/research/saintgermainbrand.com.br/header-playwright.json";
const screenshotDir = "docs/design-references/saintgermainbrand.com.br";

const properties = [
  "display", "position", "top", "left", "zIndex", "width", "height", "padding",
  "margin", "gap", "alignItems", "justifyContent", "fontFamily", "fontSize",
  "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color",
  "backgroundColor", "border", "borderBottom", "boxShadow", "opacity", "transform",
  "transition", "cursor",
];

async function stylesFor(locator) {
  if (await locator.count() === 0) return null;
  return locator.first().evaluate((element, styleProperties) => {
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: String(element.className || "").trim().replace(/\s+/g, " "),
      text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 240),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      styles: Object.fromEntries(styleProperties.map((property) => [property, computed[property]])),
    };
  }, properties);
}

async function inspectViewport(name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(source, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(6500);

  const cookieButton = page.getByText("Entendi", { exact: true });
  if (await cookieButton.isVisible().catch(() => false)) {
    await cookieButton.click({ force: true, timeout: 3000 }).catch(() => undefined);
  }
  await page.locator("hintup, [id^='manhattanHintup'], [class*='manhattanHintup']").evaluateAll((elements) => {
    for (const element of elements) element.remove();
  });

  const header = page.locator("header");
  const selectors = {
    header: "header",
    topbar: ".js-topbar",
    logoRow: ".head-logo-row",
    logo: ".logo-img",
    searchButton: ".js-search-button",
    navigation: ".head-nav",
    firstNavLink: ".nav-list-link",
  };

  const initial = {};
  for (const [key, selector] of Object.entries(selectors)) {
    initial[key] = await stylesFor(page.locator(selector));
  }

  initial.announcement = await page.evaluate((styleProperties) => {
    const candidates = [...document.querySelectorAll("a, div, span")]
      .filter((element) => {
        const text = element.textContent.trim().replace(/\s+/g, " ");
        const rect = element.getBoundingClientRect();
        return text.startsWith("SEMANA EM DOBRO") && text.length < 180 && rect.width > 100 && rect.height > 0;
      })
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height);
    const element = candidates[0];
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      classes: String(element.className || ""),
      text: element.textContent.trim().replace(/\s+/g, " "),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      styles: Object.fromEntries(styleProperties.map((property) => [property, computed[property]])),
    };
  }, properties);

  const clipHeight = Math.min(viewport.height, name === "mobile" ? 180 : 230);
  await page.screenshot({
    path: `${screenshotDir}/header-${name}-playwright.png`,
    clip: { x: 0, y: 0, width: viewport.width, height: clipHeight },
  });

  let hover = null;
  const firstNav = page.locator(".nav-list-link").first();
  if (await firstNav.isVisible().catch(() => false)) {
    const before = await stylesFor(firstNav);
    await firstNav.hover({ force: true, timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(350);
    hover = { before, after: await stylesFor(firstNav) };
  }

  let searchOpen = null;
  const searchButton = page.locator(".js-search-button").first();
  if (await searchButton.isVisible().catch(() => false)) {
    await searchButton.click({ force: true });
    await page.waitForTimeout(500);
    searchOpen = await page.evaluate((styleProperties) => {
      return [...document.querySelectorAll("input, form, [class*='search']")]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        })
        .slice(0, 30)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const computed = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            classes: String(element.className || "").trim().replace(/\s+/g, " "),
            placeholder: element.getAttribute("placeholder"),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            styles: Object.fromEntries(styleProperties.map((property) => [property, computed[property]])),
          };
        });
    }, properties);
    await page.screenshot({ path: `${screenshotDir}/header-${name}-search-open.png` });
    await page.keyboard.press("Escape");
  }

  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(650);
  const scrolled = { header: await stylesFor(header) };

  await context.close();
  return { viewport, initial, hover, searchOpen, scrolled };
}

const report = {
  source,
  capturedAt: new Date().toISOString(),
  desktop: await inspectViewport("desktop", { width: 1440, height: 900 }),
  tablet: await inspectViewport("tablet", { width: 768, height: 900 }),
  mobile: await inspectViewport("mobile", { width: 390, height: 844 }),
};

await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(`Playwright header audit saved to ${output}`);
