/*
 * Sincroniza o estoque da vitrine com o do gerenciador ("gerenciador trio max",
 * projeto Supabase `anttzsyczxbyhjuonirw`), que é onde o estoque físico é
 * controlado. A vitrine só reflete — quem manda é o gerenciador.
 *
 * O par entre os dois catálogos é declarado, não adivinhado: cada produto da
 * vitrine guarda em `produtos.id_integracao` (migração 0015 do painel) o id do
 * item correspondente em `public.products` do gerenciador, preenchido à mão na
 * tela de edição. Casar por nome não funciona aqui — o gerenciador nomeia pela
 * cor comercial do fornecedor ("Fuchsia Pink", "Verde Militar") e a vitrine
 * pela cor genérica em português ("Rosa choque", "Verde") — e errar o par
 * significa vender o que não existe ou esconder o que está disponível.
 *
 * Produto sem `id_integracao` fica de fora e não é tocado. É assim que se
 * mantém no ar um item que a loja controla por conta própria, e é também o
 * estado inicial de todo mundo: a coluna nasce vazia.
 *
 * ATENÇÃO: mexe em estoque de produção. Roda em simulação por padrão; só grava
 * com `--aplicar`.
 *
 * Uso:
 *   node scripts/sincronizar-estoque.mjs .env.local             # simula
 *   node scripts/sincronizar-estoque.mjs .env.local --aplicar   # grava
 *   node scripts/sincronizar-estoque.mjs .env.local --aplicar --revalidar
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APLICAR = process.argv.includes("--aplicar");
const REVALIDAR = process.argv.includes("--revalidar");
const CAMINHO_ENV = process.argv[2];

if (!CAMINHO_ENV) {
  console.error("Informe o caminho do .env. Ex: node scripts/sincronizar-estoque.mjs .env.local");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(CAMINHO_ENV, "utf8")
    .split("\n")
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const corte = linha.indexOf("=");
      return [linha.slice(0, corte).trim(), linha.slice(corte + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const faltando = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GERENCIADOR_SUPABASE_URL",
  "GERENCIADOR_SERVICE_ROLE_KEY",
].filter((chave) => !env[chave]);
if (faltando.length > 0) {
  console.error(`Faltam variáveis em ${CAMINHO_ENV}: ${faltando.join(", ")}`);
  process.exit(1);
}

const opcoes = { auth: { persistSession: false } };
const vitrine = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opcoes);
const gerenciador = createClient(env.GERENCIADOR_SUPABASE_URL, env.GERENCIADOR_SERVICE_ROLE_KEY, opcoes);

const { data: destino, error: erroDestino } = await vitrine
  .from("produtos")
  .select("id, slug, nome, ativo, id_integracao, estoque(quantidade)")
  .order("nome");

/* Coluna ausente = migração 0015 ainda não rodou. Sem ela o script não tem como
   saber o par de ninguém, e seguir em frente seria não fazer nada em silêncio. */
if (erroDestino) {
  if (erroDestino.code === "42703" || erroDestino.code === "PGRST204" || /id_integracao/.test(erroDestino.message)) {
    console.error(
      "A coluna `produtos.id_integracao` não existe neste banco.\n" +
        "Aplique a migração `supabase/migrations/0015_id_integracao.sql` do painel e rode de novo.",
    );
    process.exit(1);
  }
  throw new Error(`Falha ao ler a vitrine: ${erroDestino.message}`);
}

const { data: origem, error: erroOrigem } = await gerenciador.from("products").select("id, name, stock");
if (erroOrigem) throw new Error(`Falha ao ler o gerenciador: ${erroOrigem.message}`);

/* A tela do gerenciador mostra o vínculo como `TMX-0092`, derivado do id 92 —
   o código não é gravado lá, é formatado na hora. Aqui ele volta a ser o
   número para casar com `products.id`.
   O formato cru ("92") também passa: quem preenche 57 produtos à mão acaba
   digitando um ou outro, e recusar por causa do prefixo seria birra. */
function idDoGerenciador(valor) {
  const texto = valor.trim().toUpperCase();
  const comPrefixo = /^TMX-?(\d+)$/.exec(texto);
  if (comPrefixo) return String(Number(comPrefixo[1]));
  if (/^\d+$/.test(texto)) return String(Number(texto));
  return null;
}

const porIdOrigem = new Map(origem.map((p) => [String(p.id), p]));

const mudancas = [];
const iguais = [];
const quebrados = [];
const invalidos = [];
const semVinculo = [];

for (const produto of destino) {
  const digitado = (produto.id_integracao ?? "").trim();
  if (!digitado) {
    semVinculo.push(produto);
    continue;
  }

  /* Texto que não é nem TMX-0000 nem número: erro de digitação, e tratá-lo como
     "produto sem vínculo" esconderia justamente o que precisa de conserto. */
  const chave = idDoGerenciador(digitado);
  if (chave === null) {
    invalidos.push({ produto, digitado });
    continue;
  }

  const fonte = porIdOrigem.get(chave);
  /* Id apontando para item que não existe mais: o vínculo apodreceu. Manter o
     saldo atual é o menos pior — zerar tiraria do ar um produto por causa de um
     erro de digitação. */
  if (!fonte) {
    quebrados.push({ produto, digitado });
    continue;
  }

  const atual = produto.estoque?.[0]?.quantidade ?? null;
  const novo = fonte.stock ?? 0;
  const registro = { produto, atual, novo, origem: fonte.name };
  if (atual === novo) iguais.push(registro);
  else mudancas.push(registro);
}

const num = (n) => String(n).padStart(4);

console.log(`\n=== SINCRONISMO DE ESTOQUE ${APLICAR ? "(GRAVANDO)" : "(SIMULAÇÃO)"} ===`);
console.log(`Gerenciador: ${origem.length} produtos | Vitrine: ${destino.length} produtos`);
console.log(
  `Vinculados: ${mudancas.length + iguais.length} | Já iguais: ${iguais.length} | ` +
    `A mudar: ${mudancas.length} | Sem ID: ${semVinculo.length} | ` +
    `Vínculo quebrado: ${quebrados.length} | ID inválido: ${invalidos.length}\n`,
);

if (mudancas.length > 0) {
  console.log("PRODUTO                                              ATUAL  ->  NOVO   (origem no gerenciador)");
  for (const m of mudancas) {
    const marca = m.novo === 0 && m.atual > 0 ? "  ESGOTA" : m.atual === 0 && m.novo > 0 ? "  VOLTA " : "        ";
    console.log(`${m.produto.nome.slice(0, 50).padEnd(50)} ${num(m.atual)}  -> ${num(m.novo)}${marca} ${m.origem}`);
  }
}

if (quebrados.length > 0) {
  console.log(`\n!!! ${quebrados.length} produto(s) com ID de integração que não existe no gerenciador:`);
  for (const q of quebrados) console.log(`  ${q.produto.nome} — ID ${q.digitado} (estoque mantido em ${q.produto.estoque?.[0]?.quantidade ?? "—"})`);
}

if (invalidos.length > 0) {
  console.log(`\n!!! ${invalidos.length} produto(s) com ID de integração em formato irreconhecível (esperado TMX-0000):`);
  for (const i of invalidos) console.log(`  ${i.produto.nome} — "${i.digitado}"`);
}

const ativosSemVinculo = semVinculo.filter((p) => p.ativo !== false);
if (ativosSemVinculo.length > 0) {
  console.log(`\n--- ${ativosSemVinculo.length} produto(s) ativo(s) sem ID de integração (não sincronizados) ---`);
  for (const p of ativosSemVinculo) console.log(`  ${p.nome} (${p.estoque?.[0]?.quantidade ?? "—"} un)`);
}

if (!APLICAR) {
  console.log(`\nSimulação. Para gravar: node scripts/sincronizar-estoque.mjs ${CAMINHO_ENV} --aplicar\n`);
  process.exit(0);
}

if (mudancas.length === 0) {
  console.log("\nNada a gravar.\n");
  process.exit(0);
}

/* Uma linha por produto: são poucas dezenas, e o erro isolado diz qual item
   falhou em vez de derrubar o lote inteiro. */
let gravados = 0;
for (const m of mudancas) {
  const { error } = await vitrine
    .from("estoque")
    .update({ quantidade: m.novo })
    .eq("produto_id", m.produto.id);
  if (error) {
    console.error(`  FALHOU ${m.produto.slug}: ${error.message}`);
    continue;
  }
  gravados += 1;
}
console.log(`\nGravados: ${gravados} de ${mudancas.length}.`);

if (REVALIDAR) {
  const url = env.VITRINE_URL || "https://triomaxecom.vercel.app";
  const resposta = await fetch(`${url}/api/revalidar`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET ?? "" },
    body: JSON.stringify({ caminhos: ["/", "/produtos"] }),
  });
  console.log(`Revalidação em ${url}: ${resposta.status} ${await resposta.text()}`);
}
console.log("");
