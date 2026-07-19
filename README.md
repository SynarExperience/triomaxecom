# Triomax E-commerce

Storefront responsiva da Triomax para filamentos de impressão 3D, construída com Next.js, React e TypeScript.

Produção: [triomax.vercel.app](https://triomax.vercel.app)

## Estado atual

O projeto entrega a experiência visual completa de uma loja:

- Home com hero em vídeo e banners rotativos.
- Cabeçalho responsivo com busca, menu mobile e navegação por categorias.
- Faixa promocional contínua.
- Vitrine de produtos e linhas PLA/PETG.
- Catálogo com seis produtos.
- Páginas estáticas de produto com preço, ficha técnica e produtos relacionados.
- Rodapé institucional, atendimento e newsletter.

As funções comerciais ainda são demonstrativas. Carrinho, checkout, busca real, filtros, cálculo de frete, login e newsletter precisam de integrações antes da abertura da loja.

O mapa técnico completo está em [docs/ESTADO_ATUAL.md](docs/ESTADO_ATUAL.md). O backlog priorizado está em [docs/MELHORIAS_SITE.md](docs/MELHORIAS_SITE.md).

## Stack

- Next.js 16 com App Router.
- React 19.
- TypeScript 5.
- CSS Modules.
- Playwright para validação visual.
- Sharp e FFmpeg para otimização dos assets.
- Vercel para build e hospedagem.

## Rotas

| Rota | Função |
| --- | --- |
| `/` | Página inicial |
| `/produtos` | Catálogo completo |
| `/produto/[slug]` | Página individual do produto |
| `/api/status` | Health check em runtime Node.js |

## Desenvolvimento

Requisitos: Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Validação

```bash
npm run typecheck
npm run build
```

Ou execute as duas verificações:

```bash
npm run check
```

Os testes visuais específicos ficam em `scripts/qa-triomax-header.mjs` e `scripts/qa-category-showcase.mjs`.

## Assets

- `public/`: arquivos otimizados enviados ao navegador.
- `assets-src/`: imagens e vídeo originais usados como fonte de conversão.
- `Triomax/`: pacote-fonte da identidade visual.
- `scripts/optimize-assets.mjs`: pipeline reprodutível de WebP, H.264 e poster do hero.

Para reprocessar as mídias:

```bash
node scripts/optimize-assets.mjs
```

## Deploy

O diretório está vinculado ao projeto Vercel `luizmessiaass-projects/triomaxecom`.

- Project ID: `prj_NA2vMRxgrmQajLGtdo4yiCyAuqaR`
- Produção: [triomax.vercel.app](https://triomax.vercel.app)
- Framework: Next.js
- Build: `npm run build`

Arquivos locais sensíveis ou gerados — `.env.local`, `.vercel/`, `.next/`, `node_modules/` e configurações pessoais — não entram no Git.
