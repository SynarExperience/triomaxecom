# Mapa do painel interno da Nuvemshop (RHEA SHOES)

Levantamento feito com Playwright em 20/07/2026 sobre `emmashoes13.lojavirtualnuvem.com.br/admin`.
**85 telas visitadas, 72 rotas distintas, 0 erros** — a fila de navegação esgotou, ou seja, cobertura completa do que é alcançável por link a partir do `/admin`.

Screenshots e dump bruto (com dados reais de clientes — **não versionar**): `~/nuvemshop-map/out/`.

## Como o painel é organizado

O admin é um SPA. A navegação é uma sidebar fixa à esquerda (~270px) com o conteúdo à direita, e agrupa em 5 blocos:

| Bloco | Itens |
|---|---|
| — | Início, Estatísticas |
| **Gestão** | Vendas, Produtos, Nuvem Pago, Nuvem Envio, Clientes, Descontos, Marketing |
| **Canais de venda** | Loja online, Ponto de Venda, Chat, Instagram e Facebook, Google Shopping, TikTok, Pinterest, Marketplaces |
| **Aplicativos** | Loja de Aplicativos, apps instalados |
| — | Configurações (expansível) |

Itens com submenu expandem inline. Ex.: **Vendas** abre em `Lista de vendas` (com badge de contagem), `Pedidos manuais`, `Carrinhos abandonados`.

---

## 1. Pedidos — o núcleo

### `/admin/orders` — lista de vendas

**Tabela:** `Venda | Data | Cliente | Total | Produtos | Pagamento | Envio` + checkbox de seleção por linha e "selecionar todos" no header.

**Filtros por status** (chips no topo, cada um com contador):
`Por cobrar` · `Por embalar` · `Por enviar` · `Por retirar` · `Por arquivar`

**Controles:** busca livre, `Filtrar` (painel lateral), ordenação (`Mais novo`, `Data`), `Exportar lista`, `Criar um pedido`, `Cancelamento automático`, `Aplicativos`.

As colunas Pagamento e Envio são **badges de status**, não texto — é o que dá leitura rápida da lista.

### `/admin/orders/:id` — detalhe do pedido

Layout de **duas colunas**: conteúdo principal (~2/3) + "Mais informações" (~1/3).

Header: `#131` grande, badges de status (`Recusado`, `Por embalar`), e ações à direita — `Aplicativos`, `Mais opções`, `Editar`, `Imprimir resumo`.

**Coluna principal**, em cards empilhados:
1. **Detalhes do pedido** — data/hora, origem (Mobile/Desktop). Dentro, card do pacote `#1` com badge de status, linha do produto (thumb, nome, variação, SKU, qtd × preço unitário, total à direita), bloco de envio (transportadora, prazo, peso) e ações `Imprimir` / `Marcar como embalado`.
2. **Pagamento** — badge de status, `Subtotal`, `Frete (transportadora)`, `Total` destacado, meio de pagamento (ex.: Pix/Pagaleve), ação `Marcar como recebido`, link `Detalhes`.
3. **Documentos fiscais** — emissão de NF-e / DC-e.
4. **Suas anotações** — campo livre editável.

**Coluna lateral**, em cards:
- **Dados do cliente** — nome, e-mail, WhatsApp, CPF, `Editar informações`
- **Endereço de entrega e cobrança**
- **Histórico/timeline** — eventos com data e hora (ex.: "Pagamento recusado", "Está em revisão")
- **Página de acompanhamento** — `Copiar link` / `Acessar`

### Relacionados
- `/admin/draft-orders` — pedidos manuais (`Adicionar pedido`)
- `/admin/abandoned-carts` — carrinhos abandonados

---

## 2. Produtos

- `/admin/products` (e `/admin/v2/products`) — tabela `Produto | Estoque | Preço | Promocional | Variações | Ações`. **Preço e promocional são inputs editáveis direto na linha.** Busca por nome/SKU/tags. Ações: `Adicionar produto`, `Adicionar com IA`, `Exportar e Importar`, `Organizar`, `Filtrar`, ordenação.
- `/admin/products/:id` — formulário de edição: título com editor rich text (H1, Título 1), categorias, peso (kg), variações, `Gerar com IA`, autosave ("Produto salvo").
- `/admin/categories` + `/admin/categories/:id` — árvore de categorias, criar/editar/eliminar.
- `/admin/inventory` — inventário paginado (15 páginas na loja atual).
- `/admin/price-tables` — tabelas de preço.

## 3. Clientes

- `/admin/customers` — busca por nome, e-mail ou CPF. `Adicionar novo cliente`, `Mais opções`.
- `/admin/customers/:id` — detalhe, `Editar`.

## 4. Descontos

| Rota | Tabela |
|---|---|
| `/admin/coupons` | `Código \| Desconto \| Frete \| Vigência \| Usos \| Limites \| Status \| Ações` |
| `/admin/promotions` | `Nome \| Tipo de desconto \| Aplicar a \| Vigência \| Status \| Ações` |
| `/admin/free-shipping` | `Meio de envio \| Preço mínimo \| Categorias \| Zonas de entrega \| Status \| Ações` |

Cada um tem tela de edição (`/admin/coupons/:id`, `/admin/promotions/edit/:id`, `/admin/free-shipping/edit/:id`) com `Desativar`, `Eliminar`, `Salvar`, e toggle de unidade `%` / `R$`.

## 5. Estatísticas — `/admin/stats/v2/*`

`general` (visão geral) · `products` · `sales` (vendas e clientes) · `visits` · `liveview` (tempo real, abas `Visitantes` / `Pedidos e Vendas`) · `coupons` (cupons utilizados).

O dashboard `/admin` tem seletor de período `Hoje` / `Ontem` / `Esta semana` e cards de recomendação (`Gerar confiança`, `Aumentar tráfego`, `Melhorar conversão`).

## 6. Loja online

`/admin/themes` (layout atual + rascunho, logotipo) · `/admin/pages` (`Página | Última atualização | Eliminar`) e `/admin/pages/new` com editor rich text · `/admin/navigation` (menus) · `/admin/filters` · `/admin/blog` · `/admin/online-store/social-networks` · `/admin/themes/password-protected`.

## 7. Configurações

| Rota | Tela |
|---|---|
| `/admin/preferences` | Informação de contato |
| `/admin/settings/shipping-methods` | Meios de envio (abas Nacionais/Internacionais/Retiradas) |
| `/admin/settings/locations` | Centros de distribuição — `Prioridade \| Nome \| Endereço \| Estoque \| Ações` |
| `/admin/settings/domains` | `Domínios \| Status de domínio \| Status do certificado SSL \| Ações` |
| `/admin/settings/notifications` | E-mails automáticos |
| `/admin/settings/i18n` | Idiomas e moedas |
| `/admin/settings/seo-redirects` | Redirecionamentos 301 |
| `/admin/settings/external-codes` | Códigos externos (pixels, scripts) |
| `/admin/settings/whatsapp` | Botão de WhatsApp |
| `/admin/settings/info-message` | Mensagem para clientes |
| `/admin/settings/metafields` | Metafields |
| `/admin/settings/invoices`, `/settings/content-declaration` | Fiscal |

## 8. Conta

`/admin/account/shop` (dados do negócio) · `/admin/account/users` (`Nome | E-mail | Permissões | Notificações | Verificação em 2 passos | Ações`) e `/admin/account/users/:id` · `/admin/account/security/authentication-factor` (2FA) · `/admin/account/security/session-management` (`Localização | Usuário | Dispositivo | Último acesso | Fechar`) · `/admin/account/plans` (comparativo Começo/Essencial/Impulso/Escala, ciclos mensal/trimestral/anual) · `/admin/account/invoices` · `/admin/account/transaction-fees/`.

## 9. Apps e canais

`/admin/apps` (`Aplicativo | Status | Ações`), `/admin/apps/:id`, `/admin/apps/:id/authorize` (tela de permissões com `Cancelar`/`Aceitar`), `/admin/marketing/apps`, `/admin/nuvempago`, `/admin/apps/nuvemenvio`, `/admin/pos`, `/admin/chat`, `/admin/messages`, `/admin/subscriptions`, `/admin/sales-channels/marketplaces`, `/admin/social/meta/`, `/admin/apps/social-google/`, `/admin/apps/social-tiktok/`.

---

## 11. Modais, menus e wizards (o que abre ao clicar)

27 gatilhos abertos. Nada foi salvo, criado ou apagado.

### Lista de pedidos
| Gatilho | Abre |
|---|---|
| `Filtrar` | Painel: **Status da venda** (Ativas) · **Data** (Todas / Último dia / Últimos 7 dias / Últimos 30 dias) |
| `Mais novo` | Dropdown de ordenação: Mais novo / Mais antigo |
| `Aplicativos` | Integrações instaladas: Melhor Envio, Pedidos Dropi |
| `Exportar lista` | Navega para `/admin/orders/export` |
| `Criar um pedido` | Navega para `/admin/draft-orders/new` |

### Detalhe do pedido
| Gatilho | Abre |
|---|---|
| `Mais opções` | **Cancelar** e **Arquivar** — as duas ações destrutivas do pedido |
| `Aplicativos` | Melhor Envio, Pedido no Dropi |
| `Editar` | **Paywall**: "Para adicionar ou remover produtos de uma venda, você precisa subir de plano" |

### Produtos
| Gatilho | Abre |
|---|---|
| `Filtrar` | Painel por **Categoria**, com a árvore real: Todos, Sem categoria, Botas, Cano alto, Cano médio, Coturno, Sapato… |
| `Adicionar com IA` | Modal: gera dados do produto a partir de fotos arrastadas |
| `Organizar` / `Exportar e Importar` / `Adicionar produto` | `/admin/products/organize` · `/products/import` · `/products/new` |

### Outros
- **Clientes → `Mais opções`**: Exportar lista / Importar lista
- **Cupons → `Filtrar`**: Tipo de desconto (Todos / Porcentagem / Valor fixo / Frete grátis)
- **Inventário → `Filtrar`**: Ordenar por (Menor preço, Maior preço, A-Z, Z-A, Mais antigo, Mais novo)
- **Páginas → `Criar`**: modal com templates — Página em branco, Quem somos, …
- **Menus → `Criar menu`**: modal com Nome do menu + Adicionar link
- **Centros de distribuição → `Adicionar novo`**: **paywall** de plano
- **Meios de envio → `Editar`**: sai para o iframe do Nuvem Envio (`/admin/apps/nuvemenvio/#/configurations/carrier`)

> **Paywall como padrão de UI:** limites de plano aparecem como modal de upsell no lugar do formulário, não como funcionalidade escondida. Ao recriar, essas telas são funcionalidade normal — o paywall não precisa ser replicado.

## 12. Ações do pedido (ciclo de vida)

Mapeado no pedido #131.

### `Cancelar` — drawer lateral (executado no #131)
Abre como **drawer à direita**, não modal centralizado. Título: `Cancelar venda #131`.

Campo **motivo** — é um `<select>`, não radios: `O cliente mudou de ideia` (default) · `O produto não está mais disponível` · `Venda fraudulenta ou com suspeita de fraude` · `Venda de teste` · `Outro motivo`

Duas opções, **ambas marcadas por padrão**:

| Campo | Rótulo | Padrão |
|---|---|---|
| `single_email` | Enviar e-mail para o cliente | ☑️ marcado |
| `single_restock` | Restaurar estoque | ☑️ marcado |

Botões: `Fechar` / `Cancelar venda`.

> Ao recriar: o default de notificar o cliente é uma decisão de produto com efeito externo. Vale replicar o padrão de deixar explícito e desmarcável.

### `Arquivar` — **sem confirmação**
Executa imediatamente ao clicar, sem modal. Reversível pelo botão `Reabrir` no header do pedido. Registra no histórico: *"Arquivado — Por {usuário}, {data} {hora}"*.

Estado arquivado: badge `Arquivada` no header, o pedido sai do contador da lista de vendas, e as ações de fluxo (`Marcar como embalado`, `Marcar como recebido`) desaparecem — sobram `Imprimir` e `Editar informações`.

> Ação destrutiva sem confirmação é um design questionável — ao recriar, vale exigir confirmação ou oferecer desfazer imediato.

### `Reabrir`
Desfaz o arquivamento. Devolve o pedido à lista ativa e restaura as ações de fluxo. Registra `Reaberto — Por {usuário}`.

### `Marcar como embalado` / `Marcar como recebido`
Presentes no pedido ativo (card do pacote e card de pagamento). **Não executadas** — enviam notificação ao cliente. Somem no pedido arquivado/cancelado, confirmando que só existem no fluxo ativo.

### Máquina de estados observada

```
      ┌──────────► Arquivada ──── Reabrir ────┐
      │                                       │
   Ativa ◄──────────────────────────────────┘
      │
      └──────────► Cancelada  (terminal)
```

- **Arquivar** — sem confirmação, imediato, reversível por `Reabrir`.
- **Cancelar** — drawer com motivo + notificação + estoque; **terminal**, sem desfazer.
- Nos dois estados finais sobram apenas `Imprimir` e `Editar informações`.

### Histórico / timeline
Cada evento registra tipo, autor e data-hora. Sequência real capturada no #131:

```
Venda cancelada por outro motivo   Por Luiz   20 jul 12:26
Reaberto                           Por Luiz   20 jul 12:24
Arquivado                          Por Luiz   20 jul 12:18
Pagamento recusado                            19 jul 18:10
Está em revisão.                              19 jul 16:10
```

Eventos de sistema não têm autor; ações do operador registram quem fez. O motivo do cancelamento entra no próprio texto do evento (*"cancelada por outro motivo"*).

Ao concluir, a lista mostra o toast **"Venda atualizada"** e o pedido sai do contador de ativas.

### Lista de vendas — estados reais observados

| Coluna | Valores vistos |
|---|---|
| Pagamento | `Recusado` (vermelho) · `Recebido` (verde) — com o meio abaixo: `Pagaleve - Pix`, `Nuvem Pago - Pix` |
| Envio | `Por embalar` (cinza) · `Enviada` (verde) — com a transportadora: `Melhor Envio - Jadlog .Package` |

Header da lista: `Vendas` + contador `N ativas`. Rodapé: `Mostrando 1-7 vendas de 7`.

## 13. Formulários de criação

### `/admin/draft-orders/new` — novo pedido manual
Cards empilhados, rodapé `Cancelar` / `Adicionar pedido`:
1. **Produtos** — `Adicionar produtos`
2. **Dados do cliente** — `firstName`, `lastName`, `email`, `phone` (opcional), `identification` (CPF/CNPJ, opcional)
3. **Estado do pedido** — radio de 3 opções, cada uma com efeito explícito no estoque:
   - *Pagamento não realizado* — deixa o estoque sem alterações
   - *Pagamento pendente* — reserva o estoque
   - *Pagamento recebido* — desconta do estoque
4. **Informações de entrega** (colapsável) — `zipcode`, `province`, `city`, `neighborhood`, `street`, `number`, `complement`
5. **Origem do pedido** · 6. **Suas anotações**

O acoplamento estado-do-pagamento → movimento de estoque é a regra de negócio central aqui, vale replicar.

### `/admin/products/new` — novo produto
14 seções, rodapé `Cancelar` / `Salvar produto`:

| Seção | Campos |
|---|---|
| Nome e descrição | Nome, Descrição (editor rich text), `Gerar com IA` |
| Fotos e vídeo | drag & drop (mín. 1280px; WEBP/PNG/JPEG/GIF), link YouTube/Vimeo |
| Preços | Preço de venda, Preço promocional, `Exibir o preço na loja`, Custo, Margem de lucro (calculada) |
| Tipo de produto | Físico / Digital-serviço |
| Inventário | Estoque Infinito / Limitado |
| Códigos | SKU, Código de barras |
| Peso e dimensões | Peso (kg), Comprimento, Largura, Altura (cm) |
| Instagram e Google Shopping | MPN, Faixa etária, Sexo |
| Categorias | `Adicionar categorias` |
| Variações | `Adicionar variações` (ex.: cor + tamanho) |
| Campos personalizados | Cor, Referencia (paywall p/ usar como filtro) |
| Tags, Marca e SEO | `Editar` |
| Destacar produto | `Escolher seções` |
| Dados para nota fiscal | Origem, Tipo (Produção própria / Revenda), NCM, CEST, Regras fiscais |

### Nomes reais dos campos (referência de schema)

Extraídos do DOM — servem de base direta para modelar as entidades.

**Cliente** (`/admin/customers/new`)
`name` · `email` · `phone` · `identification` · `address` · `number` · `floor` · `zipcode` · `locality` · `city` · `province` · `country`

**Pedido manual** (`/admin/draft-orders/new`)
`firstName` · `lastName` · `email` · `phone` · `identification` · estado de pagamento (3 opções) · `zipcode` · `province` · `city` · `neighborhood` · `street` · `number` · `complement`

**Produto** (`/admin/products/new`)
`sku` · `barcode` · `pricePublished` · `margen` · `product-type` · `stock-mode` · `ageGroup` · `gender` · peso/dimensões · campos personalizados (Cor, Referencia)

**Cupom** (`/admin/coupons/new`)
`discountType` · `valuePercentage` · `includeShipping` · `scopeType` · `combinesWithOtherDiscounts` · `limitedType` · `clientLimitationType`

**Promoção** (`/admin/promotions/new`)
`name` · `promotionType` · `buy` / `pay` (leve X pague Y) · `scopeType` · `appliesOnPromotionalPrice` · `dateType` · e as flags de combinação: `combinesWithPriceDiscounts`, `combinesWithFreeShipping`, `combinesWithCartAmountDiscounts`, `combinesWithAppDiscounts`

**Frete grátis** (`/admin/free-shipping/new`)
`onlyCheapestShipping` · `categoriesType` · `zonesType` · `priceMinimum` · `combinesWithOtherDiscounts`

> Repare no padrão `combinesWith*`: cada tipo de desconto declara explicitamente com quais outros ele acumula. É a regra mais sutil do módulo de descontos e a mais fácil de esquecer ao recriar.

## Padrões de UI que se repetem

Vale extrair como componentes na hora de recriar:

- **Página de lista** — título + ações no header, busca, chips de filtro com contador, tabela com checkbox, ordenação, paginação.
- **Página de detalhe** — header com título/badges/ações + grid 2 colunas de cards.
- **Página de formulário** — cards de seção, rodapé fixo `Cancelar` / `Salvar`, autosave em algumas telas.
- **Badge de status** — colorido por estado, usado em lista e detalhe (pagamento, envio, vigência).
- **Estado vazio** — ilustração + texto + CTA (visto em carrinhos abandonados, assinaturas, pedidos manuais).
- **Card promocional** — a Nuvemshop injeta bastante upsell no meio do conteúdo; ao recriar, isso provavelmente sai.

## 10. Telas em iframe (micro-frontends)

13 rotas não renderizam no DOM principal — são apps separados embutidos em `<iframe>`, cada um num domínio próprio. Isso importa para recriar: **não são telas do mesmo app**, são módulos independentes acoplados por iframe.

| Rota | Origem do iframe | Conteúdo |
|---|---|---|
| `/admin/nuvempago` | `services-financials-payments-new-admin-app.tiendanube.com` | Saldo disponível, `Transferir`, Lançamentos futuros, tabela `Tipo \| Data \| Cliente \| Forma de pagamento \| Valor \| Estado` |
| `/admin/pos` | `pdv.nuvemshop.com.br` | Landing do PDV (não contratado) |
| `/admin/blog` | `cdn-blog-frontend.tiendanube.com` | `Título \| Autor \| Data de criação \| Última edição \| Visibilidade \| Ações` + `Criar post` |
| `/admin/filters` | `front-filter-settings.tiendanube.com` | Filtros da vitrine: Variações, Marca, Preço, campos personalizados |
| `/admin/price-tables` | `cdn-front-price-admin.tiendanube.com` | Landing de tabelas de preço (atacado/varejo) |
| `/admin/apps/nuvemenvio` | `services-ne-app-front.nuvemshop.com.br` | Nuvem Envio — Correios, Jadlog, Loggi, coleta |
| `/admin/social/meta/` | `front-social-meta.tiendanube.com` | Anúncios Meta com IA |
| `/admin/apps/social-tiktok/` | `social-tiktok.nuvemshop.com.br` | Conta Business conectada, Pixel, `Desconectar conta` |
| `/admin/settings/invoices` e `/settings/content-declaration` | `ns-cr-inv-k8s-invoices-front.nuvemshop.com.br` | Emissão de NF-e (mesmo app nas duas rotas) |
| `/admin/settings/metafields` | `front-metafield-admin.tiendanube.com` | Campos personalizados por entidade: Categorias, Clientes, Produtos, Variações (2 campos), Vendas |
| `/admin/apps/social-google/`, `/admin/messages` | — | sem conteúdo em iframe; provavelmente vazias no plano/estado atual |

Toda página do admin carrega ~8 iframes, a maioria infraestrutura (reCAPTCHA, validador de request, banner promocional). Só um por tela é conteúdo real.

## Notas de método

- O crawler navega **apenas por URL** e não clica em botões nem submete formulários — leitura pura.
- URLs com `excluir/cancelar/delete/sair/export/contratar/aprovar` foram bloqueadas por regex.
- Limite de 2 telas por padrão de rota (ex.: 2 pedidos, não os 8) — suficiente para estrutura.
- Scripts: `~/nuvemshop-map/scripts/1-login.mjs` (login manual com perfil persistente), `2-mapear.mjs` (crawl) e `3-iframes.mjs` (inspeção dos micro-frontends).

- Modais, dropdowns e wizards foram **abertos e fechados sem salvar** (`Escape` / recarregar a rota). Nenhum registro foi criado, alterado ou apagado.

### Lacunas conhecidas

### Alterações reais feitas na loja

Com autorização do dono, o pedido **#131** foi usado como cobaia para mapear o ciclo de vida. Os outros 7 pedidos não foram tocados.

| Quando | Ação | Observação |
|---|---|---|
| 20 jul 12:18 | Arquivado | **não intencional** — `Arquivar` executa sem confirmação |
| 20 jul 12:24 | Reaberto | necessário: `Cancelar` não fica acessível no pedido arquivado |
| 20 jul 12:26 | Cancelado | motivo "Outro motivo", **`Enviar e-mail para o cliente` desmarcado**, `Restaurar estoque` mantido |

O checkbox de e-mail foi verificado no DOM (`single_email === false`) antes de confirmar; o script abortava se não conseguisse comprovar. **Nenhum cliente foi notificado.**

- **Ações não executadas**, por efeito real e irreversível: `Marcar como embalado/recebido` (notificam o cliente), ações de plano/pagamento (fatura vencendo 29/07) e alterações de domínio/DNS. A **existência e o rótulo** dessas ações estão mapeados; só não foram confirmadas.
- **Estados de pedido sem exemplo real**: `Por cobrar`, `Por enviar` e `Por retirar` estavam zerados, então não há amostra visual dessas variações de badge/layout.
- **Fluxos multi-etapa** (ex.: `Adicionar variações`, `Adicionar produtos` dentro do pedido manual) foram abertos no primeiro nível, não percorridos até o fim.
