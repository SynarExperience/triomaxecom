/*
 * Baixa os tiles de categoria da home do voolt3d.com.br e gera as versões
 * responsivas servidas em `public/banners/voolt/`.
 *
 * O srcset da home deles só oferece a variante `-480-0`, mas a CDN aceita
 * `-640-0` na mesma chave (de 1024 para cima responde 403). Pegamos o 640, que
 * é o maior master disponível, e ele fica em `assets-src/` como todo master do
 * projeto, fora de `public/`.
 *
 * O tile renderiza a 195 CSS no desktop e ~118 no celular, então 256 e 512
 * cobrem até tela 3x — e 512 ainda cabe dentro do master, sem upscale.
 *
 * Uso: node scripts/fetch-voolt-categories.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const MASTERS = join(ROOT, "assets-src", "banners", "voolt");
const OUT = join(ROOT, "public", "banners", "voolt");
const WIDTHS = [256, 512];

const CDN = "https://acdn-us.mitiendanube.com/stores/005/959/122/themes/flex";

const tiles = [
  { slug: "v-silk", file: "2-slide-1781531152151-7445117218-3970a96c5e124cc97240ae65a082b1a71781531166-640-0.webp" },
  { slug: "cores-solidas", file: "2-slide-1781531152152-5004344180-83aaa722e7b46251c38c22798b0192fe1781531166-640-0.webp" },
  { slug: "petg", file: "2-slide-1781531152152-6192904071-e84f099137f956737ab84c7b72d06ff01781531167-640-0.webp" },
  { slug: "duo-color-shadow", file: "2-slide-1781531152152-8411474201-cccc9dbd500164af17632628077b94901781531167-640-0.webp" },
  { slug: "velvet", file: "2-slide-1781531152152-8897890055-830afafc371bebd9185ebf610eb27cf61781531168-640-0.webp" },
  { slug: "engenharia", file: "2-slide-1781531152152-701394464-9836c684232f32d0b2dc25f0ded4ad371781531168-640-0.webp" },
];

mkdirSync(MASTERS, { recursive: true });
mkdirSync(OUT, { recursive: true });

for (const { slug, file } of tiles) {
  const res = await fetch(`${CDN}/${file}`);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const master = Buffer.from(await res.arrayBuffer());

  const masterPath = join(MASTERS, `${slug}.webp`);
  writeFileSync(masterPath, master);
  const { width, height } = await sharp(master).metadata();

  for (const w of WIDTHS) {
    await sharp(master)
      .resize({ width: w, height: w, fit: "cover" })
      .webp({ quality: 82 })
      .toFile(join(OUT, `${slug}-${w}.webp`));
  }

  console.log(`${slug}: master ${width}x${height} (${(master.length / 1024).toFixed(0)} KB) -> ${WIDTHS.join(", ")}`);
}

console.log(`\n${tiles.length} tiles em public/banners/voolt/`);
