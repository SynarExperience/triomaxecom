/*
 * Pipeline de otimização dos assets de `public/`.
 *
 * Os originais de estúdio vêm em PNG de ~1,5 MB e o vídeo do hero em 8000 kb/s
 * — resolução correta, peso errado. Este script reescreve tudo em WebP/H.264
 * enxuto e guarda os arquivos originais em `assets-src/` (fora de `public/`,
 * portanto nunca servidos nem enviados no deploy).
 *
 * Uso: node scripts/optimize-assets.mjs
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const BACKUP = join(ROOT, "assets-src");

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const size = (path) => statSync(path).size;

let before = 0;
let after = 0;

/** Guarda o original uma única vez — reexecuções não sobrescrevem o backup. */
function backup(file) {
  const target = join(BACKUP, relative(PUBLIC, file));
  if (existsSync(target)) return;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(file, target);
}

/*
 * Larguras de saída por pasta. Os banners vêm de masters 4K (upscale de IA sobre
 * a arte original, que tinha 1440x480 e 390x390) e geram várias larguras para o
 * `srcset` escolher: assim um monitor 1x baixa 224 KB e só um Retina baixa os
 * 569 KB de 4K real. Sem isso, ou todo mundo carrega 4K, ou ninguém aproveita.
 *
 * `null` = mantém a resolução do master. É o caso das fotos de produto, cujo
 * 1122 px já cobre com folga os 538 px de exibição em tela 2x.
 */
const widthRules = [
  { match: /banners\/mobile\/banner-/, widths: [780, 1170] }, // hero mobile, 390 CSS em telas 2x e 3x
  { match: /banners\/banner-/, widths: [1920, 2560, 3840] }, // hero desktop, exibido a 100vw
  { match: /banners\/categories\//, widths: [780] }, // tiles de categoria, 390 CSS em tela 2x
];

function widthsFor(source) {
  const key = relative(BACKUP, source);
  return widthRules.find((rule) => rule.match.test(key))?.widths ?? [null];
}

async function toWebp(source, { width, quality }) {
  // A conversão sempre parte do original em `assets-src/`, nunca de um WebP já
  // gerado — reencodar lossy em cima de lossy acumula perda a cada execução.
  const base = join(PUBLIC, relative(BACKUP, source)).replace(/\.(png|jpe?g)$/i, "");
  // Uma largura só mantém o nome limpo; várias ganham sufixo para o srcset.
  const out = width && widthsFor(source).length > 1 ? `${base}-${width}.webp` : `${base}.webp`;
  // Uma pasta nova em `assets-src/` não existe ainda em `public/`.
  mkdirSync(dirname(out), { recursive: true });

  let pipeline = sharp(source);
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  await pipeline.webp({ quality, effort: 6 }).toFile(out);

  after += size(out);
  console.log(`  ${relative(PUBLIC, out).padEnd(42)} ${kb(size(out)).padStart(8)}`);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

console.log("\nImagens -> WebP");
// Primeira execução: os originais ainda estão em `public/`. Move para o backup
// antes de converter, para que daqui em diante a fonte seja sempre `assets-src/`.
for (const file of walk(PUBLIC).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
  backup(file);
  rmSync(file);
}

const sources = walk(BACKUP)
  .filter((f) => /\.(png|jpe?g)$/i.test(f))
  // `*-original-*` são as artes antes do upscale e `*-aposentado*` são artes que
  // saíram do site — ficam guardadas como histórico, mas não vão para `public/`.
  .filter((f) => !/-original-\d+\.|-aposentado\./.test(f));

for (const source of sources) {
  before += size(source);
  for (const width of widthsFor(source)) {
    /*
     * Qualidade 95, e não os 82 que parecem suficientes num teste rápido: estas
     * são fotos de embalagem, com texto impresso miúdo e as ranhuras finas das
     * peças. É exatamente o tipo de detalhe que o WebP lossy borra primeiro — a
     * 82 o texto do rótulo já saía ilegível.
     */
    await toWebp(source, { width, quality: 95 });
  }
}

/*
 * O master do hero é o upscale 4K (3874x2160) feito no Higgsfield. O clipe que
 * saiu do gerador tinha só 1284x716 e o hero é full-bleed, então no desktop ele
 * aparecia ampliado ~3x — era essa a origem da imagem "mole", não a compressão.
 *
 * Duas saídas, como os banners:
 *   desktop — 1920 de largura. É resolução nativa na maioria dos monitores (que
 *             são 1x) e derruba a ampliação de 3x para 2x nos Retina. Os 3840px
 *             que deixariam Retina nativo custariam 9,4 MB contra 4 MB.
 *   mobile  — recorte central 1:1 do próprio 4K. O hero é quadrado no celular,
 *             então o 16:9 aparecia com tarjas; o recorte preenche a tela e sai
 *             de 2160px de fonte para 1170px de exibição, ou seja, nativo.
 */
const VIDEO_MASTER = join(BACKUP, "banners/hero-filaments-4k.mp4");

const videoOutputs = [
  {
    label: "desktop",
    out: join(PUBLIC, "banners/hero-filaments.mp4"),
    poster: join(PUBLIC, "banners/hero-poster.webp"),
    filter: "scale=1920:-2",
  },
  {
    label: "mobile 1:1",
    out: join(PUBLIC, "banners/mobile/hero-filaments.mp4"),
    poster: join(PUBLIC, "banners/mobile/hero-poster.webp"),
    filter: "crop=2160:2160:(iw-2160)/2:0,scale=1170:1170",
  },
];

console.log("\nVídeo do hero");
if (existsSync(VIDEO_MASTER)) {
  for (const { label, out, poster, filter } of videoOutputs) {
    mkdirSync(dirname(out), { recursive: true });

    execFileSync(ffmpeg, [
      "-y",
      "-i",
      VIDEO_MASTER,
      "-an", // o player é `muted` — a trilha nunca toca, só pesa
      "-vf",
      filter,
      "-c:v",
      "libx264",
      /*
       * CRF 20: o clipe tem as voltas do filamento no carretel e o gradiente do
       * metal escovado do logo — detalhe fino e degradê suave, as duas coisas
       * que o x264 sacrifica primeiro. A 27 as voltas viravam borrão e o metal
       * ganhava banding visível.
       */
      "-crf",
      "20",
      "-preset",
      "slow",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart", // move o índice para o início: o vídeo começa sem baixar tudo
      out,
    ]);

    // Poster: primeiro frame do próprio corte, para o hero pintar antes do
    // vídeo chegar — e no enquadramento certo de cada versão.
    execFileSync(ffmpeg, ["-y", "-i", out, "-frames:v", "1", "-update", "1", `${poster}.png`]);
    await sharp(`${poster}.png`).webp({ quality: 88, effort: 6 }).toFile(poster);
    rmSync(`${poster}.png`);

    after += size(out) + size(poster);
    console.log(
      `  hero ${label.padEnd(33)} ${kb(size(out)).padStart(8)}  + poster ${kb(size(poster))}`,
    );
  }
}

console.log(
  `\nTotal: ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB ` +
    `(-${(100 - (after / before) * 100).toFixed(1)}%)\n`,
);
