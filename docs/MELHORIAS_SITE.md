# Mapa de melhorias do site Triomax

Data da auditoria: 18 de julho de 2026.

## Diagnóstico geral

O site já tem uma boa direção visual: identidade premium, hierarquia clara, responsividade consistente e páginas de catálogo e produto bem estruturadas. Porém, ainda funciona principalmente como preview. A prioridade deve ser transformar a aparência de e-commerce em uma jornada de compra real e confiável.

## Atualização implementada no cabeçalho

O topo foi reconstruído com a referência visual da Saint Germain como ponto de partida, sem substituir os elementos de marca da Triomax:

- Logo completa da Triomax, com símbolo dourado e nome, centralizada no desktop e no mobile.
- Logo ampliada para dar mais presença à marca em desktop, tablet e celular.
- Busca reduzida a um ícone de lupa; ao clicar, abre uma camada de busca com foco automático e fechamento por botão ou tecla `Esc`.
- Barra superior com atalhos de atendimento e o texto `Seja revendedor` no lugar de “Nossa loja”.
- Navegação principal mais leve, em texto, com destaque para `Ofertas`.
- Categorias com ícones SVG semânticos antes dos nomes: Filamentos, PLA, PETG, Mais vendidos, Ofertas e Acessórios.
- Faixa de anúncios contínua com fundo mesclado em preto e grafite, textos brancos e dourados e separadores dourados.
- Mensagens rotativas: parcelamento em até 12 vezes, desconto no Pix, frete grátis, envio nacional e compra segura.
- Cabeçalho fixo durante a rolagem, preservando a área comercial e ocultando somente a faixa superior no desktop.
- Menu mobile em drawer, com as categorias da Triomax e fechamento por botão ou tecla `Esc`.
- Comportamento responsivo validado em 1440 px, 768 px e 390 px.

Arquivos principais:

- [`SiteHeader.tsx`](../src/components/SiteHeader.tsx)
- [`Marquee.tsx`](../src/components/Marquee.tsx)
- [`HeaderHero.module.css`](../src/components/HeaderHero.module.css)
- [`icons.tsx`](../src/components/icons.tsx)
- [`SiteHeader.spec.md`](research/components/SiteHeader.spec.md)
- [`qa-results.json`](design-references/triomax-header/qa-results.json)

Estado da implementação: `typecheck`, build de produção e QA automatizado com Playwright aprovados.

## Atualização implementada em “Escolha sua linha”

- Banners oficiais de PLA e PETG fornecidos pela Triomax incorporados à home.
- A estrutura, os textos, os CTAs e o fundo da seção foram restaurados ao layout anterior.
- Somente as novas imagens `/banners/categories/linha-pla.webp` e `/banners/categories/linha-petg.webp` foram mantidas.

## Mapa priorizado

| Prioridade | Melhoria | Impacto | Esforço |
| --- | --- | --- | --- |
| P0 | Carrinho, checkout e pagamento funcionando | Muito alto | Alto |
| P0 | Busca, filtros, ordenação e cálculo de frete reais | Muito alto | Médio |
| P1 | Explicar a relação Masterprint + Triomax | Médio | Baixo |
| P0 | Políticas, contatos, promoções e avaliações verdadeiras | Alto | Médio |
| P1 | Melhorar página do produto e CTA de compra | Muito alto | Médio |
| P1 | Simplificar catálogo no celular | Alto | Médio |
| P1 | Otimizar imagens e vídeo | Alto | Médio |
| P1 | SEO técnico e dados estruturados | Alto | Médio |
| P1 | Acessibilidade do carrossel, menu e animações | Médio | Médio |
| P2 | Conteúdo técnico, comparadores e guias | Alto | Médio |
| P2 | Analytics, pixels e eventos de conversão | Alto | Baixo |
| P2 | CMS, estoque e catálogo administrável | Alto | Alto |

## 1. Tornar a loja funcional

Hoje várias ações não fazem nada:

- “Adicionar à sacola” possui um `onClick` vazio.
- O cálculo de CEP apenas bloqueia o envio.
- A busca não consulta produtos.
- Filtros e ordenação são apenas visuais.
- Login, sacola e páginas institucionais usam links temporários.
- A newsletter não está integrada a nenhuma plataforma.

Evidências:

- [`BuyPanel.tsx`](../src/components/BuyPanel.tsx)
- [`produtos/page.tsx`](../src/app/produtos/page.tsx)
- [`SiteHeader.tsx`](../src/components/SiteHeader.tsx)
- [`SiteFooter.tsx`](../src/components/SiteFooter.tsx)

Essa é a principal barreira para publicar o site como loja.

## 2. Explicar a relação entre fabricante e revendedora

A Masterprint é a fabricante dos filamentos e a Triomax é a revendedora. Portanto, a marca Masterprint nas embalagens está correta e as imagens não precisam ser substituídas por esse motivo.

Para tornar essa relação clara na página:

- Identificar Masterprint como marca/fabricante na ficha do produto.
- Identificar Triomax como revendedora e canal de atendimento.
- Explicar de forma objetiva quem atende garantia, troca e suporte.

Exemplos:

- [`catalog.ts`](../src/data/catalog.ts)
- [`filamento-vermelho.webp`](../public/products/filamento-vermelho.webp)

## 3. Melhorar a conversão da página do produto

Auditoria aprofundada, blueprint da nova experiência, conteúdo necessário e backlog: [`AUDITORIA_PAGINA_PRODUTO.md`](AUDITORIA_PAGINA_PRODUTO.md).

A página está visualmente organizada, mas precisa de:

- Botão “Adicionar à sacola” preto, dominante e mais evidente.
- Botão de compra fixo no rodapé do celular.
- Seletor de cor e material na própria página.
- Estado de estoque e prazo estimado.
- Galeria com embalagem, textura, peça impressa e detalhes do filamento.
- Cálculo real de entrega.
- Informação de SKU, fabricante e garantia.
- Avaliações reais, com comentários e fotos.
- Indicador “faltam R$ X para ganhar frete grátis”.
- Desconto percentual ao lado do preço anterior.
- Mensagem visual após adicionar um produto à sacola.
- Estados de carregamento, sucesso e erro.

Também é importante confirmar antes da publicação todas as alegações atualmente usadas, como “132 avaliações”, “compra 100% protegida”, “garantia de fábrica” e “envio em 24 horas”.

## 4. Simplificar o catálogo mobile

No celular, os filtros abertos ocupam grande parte da tela antes que o usuário veja qualquer produto. O ideal seria:

- Botões fixos “Filtrar” e “Ordenar”.
- Filtros dentro de drawer ou modal.
- Chips mostrando filtros aplicados.
- Ação “Limpar filtros”.
- Atualização real da quantidade de produtos encontrados.
- URLs filtráveis, como `/produtos?material=pla&cor=preto`.
- Categorias do menu apontando para filtros diferentes, em vez de todas abrirem a mesma listagem genérica.

Atualmente, os checkboxes estão apenas renderizados em [`produtos/page.tsx`](../src/app/produtos/page.tsx).

## 5. Fortalecer a página inicial

A home repete praticamente o mesmo catálogo em “Nossos filamentos” e “Todos os materiais”. Uma dessas seções poderia ser substituída por:

- “Qual material escolher?” — comparação PLA × PETG.
- Aplicações reais impressas por clientes.
- Diferenciais de bobinagem, tolerância e consistência de cor.
- Perfis de impressão para baixar.
- Kits por finalidade.
- Depoimentos reais.
- Conteúdo educativo para iniciantes.
- História da marca e motivos para comprar na Triomax.
- Projetos e estudos de caso.

As seções repetidas estão em [`HomeSections.tsx`](../src/components/HomeSections.tsx).

### Instagram

A seção de Instagram reutiliza imagens do catálogo e direciona para `instagram.com` de forma genérica. Antes da publicação, deve:

- Apontar para o perfil oficial.
- Usar conteúdo social real.
- Mostrar projetos impressos, bastidores e clientes.
- Evitar descrições que não correspondem exatamente às imagens.

## 6. Melhorar o hero

O primeiro slide é um vídeo sem headline nem CTA clicável. Acima da dobra deveria ficar claro imediatamente o que a empresa oferece.

Exemplo de mensagem:

> Filamentos de alta precisão para impressões consistentes.

Possíveis botões:

- “Comprar filamentos”.
- “Escolher meu material”.

O carrossel também precisa de:

- Botão de pausa e reprodução.
- Navegação anterior e próxima.
- Interrupção automática para quem prefere movimento reduzido.
- CTA também sobre o slide de vídeo.
- Poster já implementado nas versões desktop e mobile.
- Alturas consistentes entre vídeo e banners.

O comportamento atual está em [`HeroSection.tsx`](../src/components/HeroSection.tsx).

## 7. Performance

O pipeline de otimização já converteu as imagens para WebP, gera um vídeo desktop do hero de aproximadamente 4 MB, um recorte mobile de aproximadamente 2,5 MB e posters específicos para as duas proporções. As fotos dos filamentos agora ficam entre aproximadamente 110 e 165 KB; os banners de categoria ficam em torno de 15 KB.

Pendências atuais:

- Uso repetido de `<img>` sem geração automática de tamanhos responsivos.
- Vídeo carregado com `preload="auto"`.
- O carregamento inicial do vídeo mobile ainda precisa ser medido em redes lentas.
- Muitas imagens de produto repetidas na home.
- Ausência de métricas reais de LCP, CLS e INP em produção.

Recomendações:

- Usar `next/image` com tamanhos responsivos.
- Criar versões menores específicas para cards.
- Avaliar uma versão WebM do hero.
- Evitar baixar o vídeo completo em conexões móveis lentas.
- Definir `width`, `height` ou proporções estáveis para evitar mudanças de layout.
- Medir LCP, CLS e INP com Lighthouse e dados reais de produção.
- Carregar apenas a imagem necessária para o primeiro slide.

## 8. SEO

A metadata básica existe em [`layout.tsx`](../src/app/layout.tsx), mas faltam:

- Open Graph e Twitter Cards.
- Imagem social.
- URL canônica.
- `sitemap.xml` e `robots.txt`.
- Schema `Product`, `Offer`, `AggregateRating`, `BreadcrumbList` e `Organization`.
- Categoria indexável para PLA e PETG.
- URLs próprias para impressoras, caso continuem sendo anunciadas.
- Descrições e títulos comerciais mais específicos.
- Conteúdo exclusivo em cada categoria.
- Política para produtos esgotados e URLs removidas.
- Integração com Google Search Console.

As avaliações só devem aparecer em dados estruturados quando forem reais e verificáveis.

## 9. Acessibilidade

Melhorias recomendadas:

- Link “Pular para o conteúdo”.
- Pausa para carrossel e vídeo.
- Desabilitar autoplay com movimento reduzido.
- Impedir foco nos links do menu mobile fechado.
- Revisar contraste dos textos cinza pequenos.
- Garantir que o conteúdo continue visível se a animação `Reveal` falhar.
- Mensagens acessíveis de sucesso e erro nos formulários.
- Estados de carregamento e confirmação no carrinho.
- Validação acessível para CEP, e-mail e checkout.
- Testes completos usando somente teclado.
- Revisão com leitor de tela.

O sistema de revelação deixa o conteúdo inicialmente invisível até o JavaScript executar, conforme [`Reveal.tsx`](../src/components/Reveal.tsx). A implementação deve seguir aprimoramento progressivo: conteúdo visível por padrão e animação adicionada somente quando o JavaScript estiver disponível.

## 10. Navegação e catálogo

O catálogo atual contém somente seis filamentos. A navegação oferece Filamentos, PLA, PETG, Mais vendidos, Ofertas e Acessórios, mas todos os parâmetros de categoria ainda abrem a mesma listagem sem filtragem e não há produtos de acessórios cadastrados. A metadata global ainda menciona impressoras 3D.

É necessário alinhar o discurso com o catálogo real:

- Adicionar impressoras, peças, acessórios e outlet se essas categorias forem comercializadas.
- Caso o foco seja apenas filamentos, remover temporariamente as promessas de impressoras.
- Criar páginas próprias para PLA e PETG.
- Adicionar busca com sugestões e histórico recente.
- Oferecer comparação entre materiais.
- Transformar cores em variantes quando fizer sentido comercialmente.

Os dados atuais estão em [`catalog.ts`](../src/data/catalog.ts).

## 11. Confiança, conteúdo e aspectos legais

Antes da publicação:

- Criar páginas reais de privacidade, trocas, entregas e termos.
- Informar razão social, CNPJ e endereço quando aplicável.
- Explicar garantia, assistência e prazo de atendimento.
- Validar frete grátis, desconto no Pix e parcelamento.
- Informar regras completas da promoção “Leve 3, pague 2”.
- Remover a indicação de “dados ilustrativos” quando a loja estiver pronta.
- Usar selos e avaliações somente quando forem verdadeiros e verificáveis.
- Apontar Instagram e demais canais para URLs oficiais.

Os links institucionais atuais ainda usam `#` em [`SiteFooter.tsx`](../src/components/SiteFooter.tsx).

## 12. Dados, integrações e operação

Para transformar o preview em operação real, será necessário definir:

- Plataforma de checkout e pagamento.
- Origem do catálogo e preços.
- Controle de estoque.
- SKUs e variantes.
- Cálculo de frete e transportadoras.
- Cupons e regras de promoções.
- Recuperação de carrinho abandonado.
- Plataforma de newsletter e CRM.
- Integração fiscal e de pedidos, quando aplicável.
- Painel para gestão de produtos e pedidos.

## 13. Analytics e acompanhamento

Implementar:

- GA4 ou plataforma equivalente.
- Google Search Console.
- Meta Pixel, caso existam campanhas.
- Eventos de visualização de produto.
- Eventos de busca, filtro e seleção de variante.
- Adição e remoção do carrinho.
- Início e conclusão do checkout.
- Cliques no WhatsApp.
- Cadastro na newsletter.
- Consentimento de cookies conforme a estratégia jurídica adotada.

Os dados devem permitir acompanhar o funil:

`visita → catálogo → produto → sacola → checkout → compra`

## 14. Qualidade técnica

Além do `typecheck` e do build, o projeto deve ganhar:

- Testes unitários para preço, parcelamento e descontos.
- Testes de integração para busca, filtros e carrinho.
- Testes end-to-end para a jornada de compra.
- Testes visuais desktop e mobile.
- Monitoramento de erros em produção.
- Página personalizada de erro e produto não encontrado.
- Cabeçalhos de segurança adequados ao ambiente de produção.
- Manter README, mapa técnico e backlog sincronizados com cada publicação.

## Ordem recomendada de execução

### Etapa 1 — Loja funcional

1. Carrinho e estado persistente.
2. Checkout e pagamento.
3. Busca, filtros e ordenação reais.
4. Cálculo de frete.
5. Newsletter e formulários.

### Etapa 2 — Confiança e consistência

1. Explicar Masterprint como fabricante e Triomax como revendedora.
2. Substituir dados ilustrativos.
3. Criar páginas institucionais e políticas.
4. Validar promoções, garantias e avaliações.
5. Corrigir todos os links temporários.

### Etapa 3 — Conversão e experiência mobile

1. Reforçar CTA da página do produto.
2. Criar seletor de variantes.
3. Adicionar galeria e conteúdo técnico.
4. Criar filtros mobile em drawer.
5. Adicionar compra fixa no celular.

### Etapa 4 — Performance, SEO e acessibilidade

1. Otimizar imagens e vídeo.
2. Implementar metadata social e dados estruturados.
3. Criar sitemap e robots.
4. Corrigir carrossel, menu mobile e `Reveal`.
5. Realizar auditoria Lighthouse e testes com teclado.

### Etapa 5 — Crescimento

1. Analytics e pixels.
2. Conteúdo educativo.
3. Prova social real.
4. Recuperação de carrinho.
5. CMS, estoque e automações operacionais.

## Resultado esperado

Ao concluir as primeiras quatro etapas, o site deixa de ser apenas uma apresentação visual e passa a oferecer uma jornada completa, confiável, rápida e mensurável, pronta para receber tráfego e converter vendas.

O redesenho do cabeçalho e da faixa de anúncios descrito acima já foi implementado. Os demais itens permanecem como mapa priorizado para as próximas etapas.
