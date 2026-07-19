# Estado atual do site Triomax

Última consolidação: 18 de julho de 2026.

## Resumo executivo

O repositório contém uma vitrine responsiva da Triomax pronta para demonstração e deploy na Vercel. A camada visual, o catálogo estático e as páginas de produto estão implementados. A operação de e-commerce ainda não está conectada a carrinho, checkout, estoque, pagamento, frete, CRM ou CMS.

## Arquitetura

| Camada | Implementação |
| --- | --- |
| Framework | Next.js 16, App Router |
| Interface | React 19 e CSS Modules |
| Linguagem | TypeScript 5 |
| Fontes | Neulis Neue local; Jost, Poppins e Urbanist via `next/font` |
| Catálogo | Dados estáticos em `src/data/catalog.ts` |
| Hospedagem | Vercel |
| Testes visuais | Playwright com Chrome headless |
| Otimização de mídia | Sharp e FFmpeg |

## Rotas publicadas

| Rota | Renderização | Estado |
| --- | --- | --- |
| `/` | Estática | Home completa |
| `/produtos` | Estática | Seis produtos e filtros visuais |
| `/produto/[slug]` | SSG | Seis páginas geradas por `generateStaticParams` |
| `/api/status` | Dinâmica | Retorna `{ status: "ok", runtime: "nodejs" }` |
| Rotas inexistentes | Next.js | Página padrão de não encontrado |

## Página inicial

A composição atual segue esta ordem:

1. `SiteHeader`.
2. `AnnouncementMarquee`.
3. `HeroSection`.
4. `BenefitsBar`.
5. `FeaturedProducts`.
6. `CategoryShowcase`.
7. `PromoBanner`.
8. `PrintersRail`, apesar do nome histórico, exibe todos os filamentos.
9. `InstagramSection`.
10. `SiteFooter`.

## Cabeçalho e navegação

- Cabeçalho sticky em três faixas no desktop e linha compacta no celular.
- Logo completa Triomax com símbolo dourado.
- Lupa abre diálogo de busca com foco automático, bloqueio de scroll e fechamento por `Esc`.
- Menu mobile é renderizado somente quando aberto e fecha por `Esc` ou seleção.
- Links superiores: WhatsApp, atendimento, rastreio, FAQ, revenda e troca fácil.
- Categorias com ícones SVG: Filamentos, PLA, PETG, Mais vendidos, Ofertas e Acessórios.
- O parâmetro da categoria aparece na URL, mas a listagem ainda não interpreta esses filtros.

## Faixa de anúncios

- Loop horizontal contínuo em preto/grafite, branco e dourado.
- Mensagens com ícones: 12 vezes sem juros, desconto no Pix, frete grátis, envio nacional e compra segura.
- Pausa no hover e redução de movimento respeitada via CSS.

## Hero

- Um slide de vídeo e três banners clicáveis.
- Imagens separadas para desktop e celular usando `picture`.
- Pontos de navegação com estado acessível.
- Avanço por fim do vídeo ou temporizador de segurança.
- Banners avançam a cada seis segundos.
- Poster evita tela preta durante o carregamento.
- Vídeo e poster possuem versões específicas para desktop e celular.

### Mídia responsiva

O pipeline parte de `assets-src/banners/hero-filaments-4k.mp4` e gera:

- `/banners/hero-filaments.mp4` e `/banners/hero-poster.webp` para desktop.
- `/banners/mobile/hero-filaments.mp4` e `/banners/mobile/hero-poster.webp` em recorte 1:1 para celular.

## Catálogo

- Seis filamentos estáticos: quatro PLA e dois PETG.
- Cores: branco, preto, amarelo, vermelho, azul e verde.
- Preços, desconto Pix, parcelamento e produto em oferta calculados no frontend/servidor a partir de dados locais.
- Cards apontam para páginas próprias por slug.
- Filtros, ordenação e checkboxes ainda não alteram a lista.
- Busca envia `q` para `/produtos`, mas a página ainda ignora o parâmetro.

## Página de produto

- Imagem, badge, nome, linha, avaliação ilustrativa, preço, Pix e parcelamento.
- Controle local de quantidade entre 1 e 9.
- Descrição, especificações, entrega e troca em accordions.
- Produtos relacionados.
- Botão de sacola sem integração.
- Formulário de CEP apenas impede o envio e não consulta frete.

## Seção “Escolha sua linha”

- Layout claro original com dois cards responsivos.
- Novas artes fornecidas para PLA e PETG.
- Assets públicos otimizados:
  - `/banners/categories/linha-pla.webp`.
  - `/banners/categories/linha-petg.webp`.
- O CTA `Explorar` abre o catálogo geral; a filtragem por material ainda é futura.

## Rodapé

- Bloco de newsletter, marca, institucional, categorias e atendimento.
- WhatsApp aponta para o número configurado no código.
- Instagram usa URL genérica.
- Links institucionais usam `#`.
- Newsletter não possui action ou integração.
- O próprio rodapé identifica o conteúdo como preview com dados ilustrativos.

## Assets e performance

### Estado otimizado

- `public/` ocupa aproximadamente 10 MB.
- Vídeo desktop do hero: aproximadamente 4 MB em 1920 px de largura.
- Poster desktop: aproximadamente 105 KB.
- Vídeo mobile do hero: aproximadamente 2,5 MB em recorte quadrado de 1170 px.
- Poster mobile: aproximadamente 51 KB.
- Banners desktop: aproximadamente 105–124 KB cada.
- Banners mobile: aproximadamente 36–40 KB cada.
- Banners de categoria: aproximadamente 15 KB cada.
- Fotos dos seis filamentos: aproximadamente 110–165 KB cada.
- Imagens de catálogo e banners são WebP.
- Cache de um dia com `stale-while-revalidate` de uma semana para WebP, MP4, SVG e WOFF2.

### Fontes e originais

- `assets-src/` guarda os arquivos originais usados pelo pipeline.
- `Triomax/` guarda AI, EPS, PDF, PNG, JPEG e SVG da identidade visual.
- `scripts/optimize-assets.mjs` sempre converte a partir dos originais para evitar recompressão acumulada.

## Funcionalidades concluídas

- Layout responsivo em home, catálogo e produto.
- Cabeçalho sticky e menu mobile.
- Diálogo visual de busca.
- Carrossel do hero.
- Catálogo estático e páginas de produto.
- Quantidade local na página do produto.
- Estados de foco e atalhos de teclado do cabeçalho.
- Assets otimizados e cache configurado.
- Health check.
- Build e typecheck automatizados via npm.
- Scripts Playwright para cabeçalho e categorias.

## Funcionalidades demonstrativas

- Busca de produto.
- Filtros e ordenação.
- Conta do cliente.
- Sacola e checkout.
- Cálculo de frete.
- Estoque e variações.
- Newsletter.
- Avaliações.
- Links institucionais.
- Instagram oficial.
- Promoções e garantias usadas no texto.

## Qualidade e validação

Comandos disponíveis:

```bash
npm run typecheck
npm run build
npm run check
```

QA visual:

```bash
node scripts/qa-triomax-header.mjs http://127.0.0.1:3013
node scripts/qa-category-showcase.mjs http://127.0.0.1:3013
```

Evidências ficam em `docs/design-references/` e resultados estruturados em arquivos `qa-results.json`.

## Versionamento

O repositório deve incluir:

- Código em `src/`.
- Assets de produção em `public/`.
- Originais em `assets-src/`.
- Pacote-fonte da marca em `Triomax/`.
- Documentação em `docs/`.
- Scripts de auditoria, QA e otimização em `scripts/`.
- Configuração e lockfile do projeto.

Devem ficar fora do Git:

- `node_modules/`.
- `.next/` e `out/`.
- `.env*`, exceto eventual `.env.example`.
- `.vercel/`.
- `.claude/` e configurações pessoais.
- Logs e arquivos `*.tsbuildinfo`.

## Vercel

- Conta autenticada: `luizmessiaass`.
- Equipe: `luizmessiaass-projects`.
- Projeto: `triomaxecom`.
- Project ID: `prj_NA2vMRxgrmQajLGtdo4yiCyAuqaR`.
- Framework: Next.js.
- Root directory: `.`.
- Produção: [triomax.vercel.app](https://triomax.vercel.app).
- Último deploy inspecionado: status `Ready`.

## Próximas prioridades

1. Implementar carrinho e checkout.
2. Tornar busca, filtros e ordenação funcionais.
3. Integrar cálculo de frete, estoque e pagamento.
4. Substituir dados ilustrativos e validar todas as alegações comerciais.
5. Criar políticas e links institucionais reais.
6. Medir o impacto real dos vídeos responsivos em LCP e consumo de dados.
7. Configurar analytics, SEO social e dados estruturados.

O detalhamento completo de impacto, esforço e ordem está em [`MELHORIAS_SITE.md`](MELHORIAS_SITE.md).
