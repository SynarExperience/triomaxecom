/*
 * Migra as fotos dos produtos de caminho relativo (`/products/x.webp`, que só
 * resolve no domínio da loja) para o Supabase Storage, gravando a URL pública
 * absoluta no banco — que resolve tanto na loja quanto no admin.
 *
 * A service_role é buscada na hora pela API de gerenciamento, usando o token
 * `sbp_` passado em SUPABASE_ACCESS_TOKEN. Nenhuma chave é gravada em disco.
 *
 * Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/migrar-fotos-storage.mjs [--dry]
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const ROOT = join(import.meta.dirname, "..");
const BUCKET = "produtos";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = SUPABASE_URL.replace(/^https:\/\/([^.]+)\..*/, "$1");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) throw new Error("Falta SUPABASE_ACCESS_TOKEN (sbp_...).");

// --- pega a service_role pela API de gerenciamento --------------------------
const chaves = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
}).then((r) => r.json());
const service = chaves.find((k) => k.name === "service_role")?.api_key;
if (!service) throw new Error("Não achei a service_role na resposta da API.");

const sb = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });

// --- garante o bucket público ----------------------------------------------
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  if (DRY) {
    console.log(`[dry] criaria o bucket público "${BUCKET}"`);
  } else {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/webp", "image/png", "image/jpeg", "image/gif", "image/avif"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
    console.log(`bucket "${BUCKET}" pronto (público)`);
  }
} else {
  console.log(`bucket "${BUCKET}" já existe`);
}

const publicUrl = (caminho) => sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;

/** Sobe um `/products/x.webp` local e devolve a URL pública; idempotente. */
const cacheUpload = new Map();
async function subir(relativo) {
  if (!relativo || !relativo.startsWith("/products/")) return null; // já é absoluta ou vazia
  if (cacheUpload.has(relativo)) return cacheUpload.get(relativo);

  const nomeArquivo = relativo.replace(/^\/products\//, "");
  const destino = nomeArquivo; // mantém o mesmo nome dentro do bucket
  const url = publicUrl(destino);

  if (DRY) {
    console.log(`[dry] subiria ${relativo} -> ${url}`);
    cacheUpload.set(relativo, url);
    return url;
  }

  const bytes = await readFile(join(ROOT, "public", relativo)).catch(() => null);
  if (!bytes) {
    console.log(`!! arquivo local ausente: public${relativo} — pulei`);
    cacheUpload.set(relativo, null);
    return null;
  }

  const { error } = await sb.storage.from(BUCKET).upload(destino, bytes, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  console.log(`↑ ${relativo} -> ${url}`);
  cacheUpload.set(relativo, url);
  return url;
}

// --- produtos.imagem --------------------------------------------------------
const { data: produtos, error: erroProd } = await sb
  .from("produtos")
  .select("id, slug, imagem");
if (erroProd) throw erroProd;

for (const p of produtos) {
  const url = await subir(p.imagem);
  if (!url || url === p.imagem) continue;
  if (DRY) { console.log(`[dry] produtos ${p.slug}.imagem -> storage`); continue; }
  const { error } = await sb.from("produtos").update({ imagem: url }).eq("id", p.id);
  if (error) throw error;
  console.log(`✓ produtos ${p.slug}`);
}

// --- fotos_produto.url ------------------------------------------------------
const { data: fotos, error: erroFotos } = await sb
  .from("fotos_produto")
  .select("id, url, alt");
if (erroFotos) throw erroFotos;

for (const f of fotos) {
  const url = await subir(f.url);
  if (!url || url === f.url) continue;
  if (DRY) { console.log(`[dry] fotos_produto ${f.alt} -> storage`); continue; }
  const { error } = await sb.from("fotos_produto").update({ url }).eq("id", f.id);
  if (error) throw error;
  console.log(`✓ foto ${f.alt}`);
}

console.log(DRY ? "\n[dry] nada foi alterado" : "\nmigração concluída");
