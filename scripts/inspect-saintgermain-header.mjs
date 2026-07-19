import { writeFile } from "node:fs/promises";

const port = process.argv[2] ?? "9223";
const output = process.argv[3] ?? "docs/research/saintgermainbrand.com.br/header-extraction.json";
const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const page = pages.find((item) => item.type === "page");

if (!page?.webSocketDebuggerUrl) {
  throw new Error("Nenhuma página disponível no Chrome DevTools Protocol.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
let commandId = 0;
const pending = new Map();

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.value;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await command("Page.enable");
await command("Runtime.enable");

const extractionExpression = String.raw`(() => {
  const styleProps = [
    "display", "position", "top", "right", "bottom", "left", "zIndex",
    "width", "height", "minHeight", "maxWidth", "padding", "margin", "gap",
    "gridTemplateColumns", "alignItems", "justifyContent", "overflow",
    "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
    "textTransform", "color", "backgroundColor", "border", "borderBottom",
    "boxShadow", "opacity", "transform", "transition", "cursor"
  ];

  const header = document.querySelector("header") ||
    [...document.querySelectorAll("body > *")].find((element) =>
      /header|cabecalho|head-main/i.test(String(element.className))
    );

  if (!header) return { error: "header not found" };

  const headerRect = header.getBoundingClientRect();
  const nodes = [header, ...header.querySelectorAll("*")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && rect.top < 330 && rect.bottom > -20 &&
        style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    })
    .slice(0, 180)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      const styles = {};
      for (const property of styleProps) styles[property] = computed[property];
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: String(element.className || "").trim().replace(/\s+/g, " ").slice(0, 220),
        text: (element.children.length === 0 ? element.textContent : "").trim().replace(/\s+/g, " ").slice(0, 140),
        ariaLabel: element.getAttribute("aria-label"),
        title: element.getAttribute("title"),
        href: element.getAttribute("href"),
        src: element.currentSrc || element.getAttribute("src"),
        rect: {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        },
        styles,
      };
    });

  return {
    viewport: { width: innerWidth, height: innerHeight, scrollY },
    body: {
      fontFamily: getComputedStyle(document.body).fontFamily,
      color: getComputedStyle(document.body).color,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
    },
    header: {
      tag: header.tagName.toLowerCase(),
      id: header.id || null,
      classes: String(header.className || ""),
      rect: { x: headerRect.x, y: headerRect.y, width: headerRect.width, height: headerRect.height },
      styles: Object.fromEntries(styleProps.map((property) => [property, getComputedStyle(header)[property]])),
    },
    nodes,
  };
})()`;

async function extractViewport(width, height) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 390,
  });
  await command("Page.reload", { ignoreCache: false });
  await sleep(6500);
  await evaluate("window.scrollTo(0, 0)");
  await sleep(350);
  const initial = await evaluate(extractionExpression);
  await evaluate("window.scrollTo(0, 420)");
  await sleep(600);
  const scrolled = await evaluate(extractionExpression);
  await evaluate("window.scrollTo(0, 0)");
  return { initial, scrolled };
}

const extraction = {
  source: "https://www.saintgermainbrand.com.br/",
  capturedAt: new Date().toISOString(),
  desktop: await extractViewport(1440, 900),
  tablet: await extractViewport(768, 900),
  mobile: await extractViewport(390, 844),
};

await writeFile(output, `${JSON.stringify(extraction, null, 2)}\n`);
socket.close();

console.log(`Header extraction saved to ${output}`);
