# Auditoria e blueprint da página de produto Triomax

Data da análise: 18 de julho de 2026.

## Resumo executivo

A página atual não parece genérica por falta de efeitos visuais. Ela parece genérica porque ainda apresenta o filamento como qualquer produto de e-commerce: uma foto, um título, um preço, alguns selos e um botão.

Para a Triomax, a página precisa cumprir três funções ao mesmo tempo:

1. Ajudar o cliente a escolher material, cor e quantidade sem voltar ao catálogo.
2. Provar tecnicamente por que aquele filamento serve para o projeto dele.
3. Remover as dúvidas de compra com estoque, prazo, frete, garantia e suporte reais.

A proposta é transformar a página em uma **ficha de decisão e compra para impressão 3D**, preservando a estética premium em preto, branco, grafite e dourado leve.

A presença da Masterprint nas embalagens está correta: a Triomax revende os produtos da fabricante. Isso não é uma divergência de marca. A oportunidade é apenas deixar a relação comercial clara na página, com Masterprint identificada como marca do produto e Triomax como loja e canal de atendimento.

## O que torna a página atual genérica

| Área | Estado atual | Problema percebido |
| --- | --- | --- |
| Mídia | Uma única imagem da embalagem | Não mostra cor real, textura, brilho, acabamento nem resultado impresso |
| Marca e revenda | A embalagem mostra Masterprint, fabricante revendida pela Triomax | Tornar essa relação explícita no título ou próximo à área de compra |
| Avaliação | `4,9 · 132 avaliações` fixo | Parece ilustrativo; sem comentários ou prova, pode reduzir credibilidade |
| Escolha | Sem seletor de cor, material, peso ou variante | O cliente precisa voltar ao catálogo e comparar mentalmente |
| Compra | Quantidade local e botão sem integração | A interface promete uma compra que ainda não acontece |
| Estoque | Não exibido | O usuário não sabe se a variante escolhida está disponível |
| Frete | Campo de CEP sem cálculo | A maior dúvida operacional continua sem resposta |
| Argumento | Uma frase curta e benefícios genéricos | Não diferencia o filamento nem explica para qual projeto ele serve |
| Especificações | Diâmetro, peso e duas temperaturas | Faltam parâmetros de impressão, embalagem, secagem e desempenho |
| Prova técnica | Nenhuma ficha, teste, perfil ou documento | Não existe evidência para sustentar uma posição premium |
| Conteúdo | Quase tudo escondido em accordions | A página não cria uma narrativa de produto durante a rolagem |
| Relacionados | Quatro primeiros itens diferentes do atual | Recomendação sem relação clara com cor, material ou intenção de uso |
| Mobile | Layout empilhado comum | Falta uma barra de compra fixa com variante, preço e CTA |
| SEO de produto | Metadata básica | Faltam dados estruturados de produto, oferta, estoque e variantes |

Evidências no projeto:

- [`page.tsx`](../src/app/produto/[slug]/page.tsx)
- [`BuyPanel.tsx`](../src/components/BuyPanel.tsx)
- [`catalog.ts`](../src/data/catalog.ts)
- [`pages.module.css`](../src/components/pages.module.css)

## Referências e aprendizados do benchmark

O estudo da Baymard trata a página de produto como o centro da decisão de compra e separa os principais problemas em galeria, seção de compra, variações, envio e devolução, descrição, especificações, avaliações e produtos complementares. Na análise publicada em 2026, a empresa afirma que 62% dos sites avaliados ainda têm uma experiência de produto apenas mediana ou pior. Isso mostra que uma página bonita, isoladamente, não resolve a decisão. Fontes: [Product Page UX](https://baymard.com/research/product-page) e [Current State of E-Commerce Product Page UX](https://baymard.com/blog/current-state-ecommerce-product-page-ux).

No nicho de impressão 3D, a Prusament organiza o conteúdo por prós, contras, aplicações, nível de dificuldade, resistência térmica, tendência a empenar, abrasividade e requisitos da impressora. Também oferece ficha técnica e ficha de segurança. A lição para a Triomax é explicar **quando escolher e quando não escolher** o material, em vez de usar apenas adjetivos positivos. Fonte: [Prusament PLA](https://prusament.com/materials/pla/).

A Polymaker apresenta propriedades com método de teste, condições recomendadas de impressão, secagem, retração e documentação técnica. A Triomax não precisa começar com um laboratório completo, mas precisa separar claramente especificação medida, recomendação de uso e texto comercial. Fonte: [PolyLite PLA — ficha técnica](https://wiki.polymaker.com/polymaker-products/more-about-our-products/documents/technical-data-sheets/pla/polylite-tm-pla).

No mercado brasileiro, a Voolt3D dá destaque a estoque, desconto no Pix, prazo de envio, kits e canal de atacado. Esses elementos não substituem a prova técnica, mas mostram oportunidades comerciais locais relevantes para a Triomax: kits por volume, reposição recorrente e acesso para revendedores. Fonte: [Voolt3D](https://voolt3d.com.br/).

Para busca orgânica, o Google recomenda dados estruturados `Product` e `Offer`; quando há variações, também documenta o agrupamento por `ProductGroup`. Preço, disponibilidade, frete e devolução podem aparecer de forma mais rica nos resultados quando a implementação e os dados são válidos. Fontes: [Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product) e [Merchant listing structured data](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).

## Direção proposta

### Posicionamento da página

Cada produto deve responder rapidamente:

- O que é?
- Para quais projetos serve?
- Qual é a cor e o acabamento reais?
- Funciona na minha impressora?
- Quais configurações devo usar?
- Está disponível e quando chega?
- Por que devo confiar nesta marca e neste lote?

Uma frase-guia para o design:

> A página de produto Triomax é o ponto em que o cliente escolhe, valida tecnicamente e compra o material certo para o projeto.

### Estrutura acima da dobra

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Início / Filamentos / PLA / Preto                       │
├─────────────────────────────────┬───────────────────────────────────┤
│ Miniaturas                      │ TRIOMAX · PLA PERFORMANCE · 1,75  │
│                                 │ Nome claro do filamento           │
│ Foto principal / zoom           │ Resumo de uso em uma linha        │
│                                 │ Avaliações reais ou nenhum número │
│ embalagem · peça impressa       │                                   │
│ textura · etiqueta · vídeo      │ Material: [PLA] [PETG]            │
│                                 │ Cor: ● Preto — 6 cores             │
│                                 │ Peso: [1 kg]  Estoque: disponível │
│                                 │                                   │
│                                 │ Pix / preço / parcelamento        │
│                                 │ [− 1 +] [Adicionar à sacola]      │
│                                 │ CEP, data estimada e frete        │
│                                 │ Ajuda técnica pelo WhatsApp       │
└─────────────────────────────────┴───────────────────────────────────┘
```

#### Galeria recomendada

A página deve ter de cinco a sete mídias úteis, não várias fotos repetidas:

1. Bobina e embalagem de frente, com a marca correta legível.
2. Bobina em ângulo, mostrando enrolamento e quantidade.
3. Close do filamento para comunicar cor, brilho e textura.
4. Peça realmente impressa naquela cor.
5. Macro do acabamento e das camadas da peça.
6. Etiqueta ou esquema com dimensões, lote e informações da bobina.
7. Vídeo curto mostrando a bobina e a peça sob luz neutra, se houver material bom.

A troca de cor precisa atualizar a foto principal e as imagens de resultado. A amostra digital de cor deve ser acompanhada do aviso de que telas podem alterar a percepção.

#### Painel de compra recomendado

Ordem ideal:

1. Linha, material e diâmetro como contexto curto.
2. Nome do produto orientado à busca e à escolha.
3. Resumo de uma linha sobre a aplicação principal.
4. Avaliação real e link para os comentários; se não houver avaliações verificadas, esconder o bloco.
5. Até três diferenciais mensuráveis e confirmados.
6. Seletores de material, cor, peso e tipo de bobina/refil.
7. Disponibilidade da variante e código SKU.
8. Preço Pix em destaque, preço normal, desconto real e parcelamento.
9. Opções `1 unidade`, `kit com 3` ou compra recorrente, caso a operação suporte.
10. Quantidade e CTA dominante.
11. Cálculo de CEP com custo e intervalo estimado de entrega.
12. Progresso para frete grátis, calculado com o carrinho real.
13. Link discreto `Precisa de ajuda para configurar? Fale com um especialista`.

O CTA principal deve usar preto ou grafite profundo para manter contraste e autoridade. O dourado funciona melhor em pequenos destaques, estados selecionados e selos; usar dourado em todos os blocos deixa o produto menos técnico e mais promocional.

### Estrutura abaixo da dobra

#### 1. Resultado antes da teoria

Abrir a rolagem com uma peça impressa grande e uma mensagem específica do material. Para PLA, por exemplo, a seção pode falar de definição de detalhes e facilidade de impressão; para PETG, de resistência e uso funcional. A frase final só deve ser publicada depois de validada pela equipe técnica.

#### 2. `Por que este filamento imprime melhor?`

Apresentar três provas, cada uma com métrica ou processo verificável:

- Controle de diâmetro e tolerância.
- Consistência de cor entre lotes.
- Bobinamento, embalagem a vácuo e controle de umidade.

Não usar números como `±0,02 mm`, velocidade máxima ou promessa de baixa umidade sem documentação do fornecedor ou medição própria.

#### 3. `É o material certo para o seu projeto?`

Uma matriz visual ajuda o cliente a decidir entre PLA e PETG:

| Critério | PLA | PETG |
| --- | --- | --- |
| Facilidade para iniciantes | Explicação validada | Explicação validada |
| Peças decorativas e detalhes | Explicação validada | Explicação validada |
| Resistência a impacto | Explicação validada | Explicação validada |
| Temperatura e uso externo | Limites confirmados | Limites confirmados |
| Acabamento | Foto real e descrição | Foto real e descrição |

Os valores finais precisam vir do material realmente vendido, e não de uma descrição genérica de PLA ou PETG encontrada na internet.

#### 4. `Perfil recomendado de impressão`

Deixar os parâmetros essenciais visíveis em uma tabela, sem esconder tudo em accordion:

- Temperatura do bico.
- Temperatura da mesa.
- Velocidade de impressão e volumétrica, se testada.
- Ventilação.
- Superfície recomendada e necessidade de adesivo.
- Retração para direct drive e Bowden.
- Necessidade de câmara fechada.
- Temperatura e tempo de secagem.
- Armazenamento após aberto.
- Diâmetros de bico testados.

Complementar com perfis para OrcaSlicer, Bambu Studio, PrusaSlicer e Cura apenas quando forem testados pela Triomax.

#### 5. `Compatibilidade`

Explicar compatibilidade por diâmetro, sistema de extrusão e limitações. Em vez de uma lista enorme de marcas, a página pode dizer que é compatível com impressoras FDM/FFF que utilizam o diâmetro informado, seguida das condições e exceções verificadas.

#### 6. `O que vem na caixa`

Mostrar:

- Peso líquido e peso bruto.
- Comprimento aproximado, se calculado e conferido.
- Dimensões externas, furo e largura da bobina.
- Material da bobina.
- Embalagem a vácuo e dessecante, se existentes.
- Identificação de lote e rastreabilidade.

#### 7. Downloads e documentos

Criar uma área própria para:

- Ficha técnica `TDS`.
- Ficha de segurança `SDS/FISPQ`, quando aplicável.
- Perfis de impressão testados.
- Guia rápido de armazenamento e secagem.
- Arquivo de amostra ou teste de calibração, se a marca decidir oferecê-lo.

#### 8. Avaliações e dúvidas reais

Avaliações devem permitir, no mínimo, nota, comentário, data e produto comprado. A evolução ideal inclui foto da impressão, impressora usada, cor e filtro por material. Um bloco de perguntas e respostas técnicas pode capturar dúvidas que hoje iriam para WhatsApp e ainda melhorar o conteúdo da página.

#### 9. Recomendação com intenção

Substituir `Produtos relacionados` genérico por dois blocos curtos:

- `Mais cores desta linha`: variantes do mesmo material.
- `Complete seu projeto`: adesivo, bico, mesa, secador ou ferramenta realmente compatível.

Kits devem ser apresentados quando houver uma economia real: três cores, reposição de produção ou combinação por projeto.

### Mobile

No celular, a página deve priorizar:

- Foto principal grande e miniaturas roláveis.
- Título, cor selecionada, preço e estoque antes de textos longos.
- Seletores com alvos de toque confortáveis.
- Barra inferior fixa com preço e `Adicionar à sacola`.
- Respeito à área segura do aparelho e ao teclado durante o CEP.
- Conteúdo técnico em blocos curtos, com a tabela principal visível.
- Zoom acessível e sem bloquear o gesto de rolagem.

## Linguagem e identidade visual

### Manter

- Preto, branco, grafite e dourado discreto.
- Logo Triomax com boa presença.
- Tipografia limpa e espaçamento amplo.
- Ícones lineares e acabamento minimalista.

### Mudar

- Evitar uma moldura em volta de cada informação.
- Usar fundo branco quente ou cinza muito claro para separar módulos técnicos.
- Reservar o dourado para seleção, pequenos títulos, divisores e microdetalhes.
- Usar fotografia de resultado como principal elemento de emoção.
- Usar tabelas e diagramas simples como principal elemento de autoridade.
- Trocar frases como `alta qualidade` e `resultado premium` por dados, processo ou aplicação concreta.

### Não usar

- Avaliações fictícias.
- Contagem regressiva artificial.
- Estoque falso ou urgência sem base operacional.
- Selos de garantia sem política correspondente.
- Carrossel automático na galeria principal.
- Promessas técnicas copiadas de outro fabricante.
- Excesso de dourado, gradientes metálicos ou sombras pesadas.

## Dados necessários antes da implementação final

### Identidade e operação

- Masterprint identificada como fabricante/marca do produto e Triomax como revendedora.
- Regra de garantia: o que é atendido pela Triomax e o que depende da fabricante.
- SKU e GTIN/EAN de cada variante.
- Estoque por cor, material e peso.
- Regra real de frete grátis, prazo de expedição e transportadoras.
- Política de garantia, troca e devolução.
- Condições de Pix e parcelamento.
- Canal e horário do suporte técnico.

### Produto

- Diâmetro nominal e tolerância comprovada.
- Peso líquido, peso bruto e dimensões da bobina.
- Densidade e comprimento estimado, quando confiáveis.
- Temperaturas de bico e mesa por material.
- Velocidade, ventilação, retração e secagem testadas.
- Material da bobina e características da embalagem.
- Resistência térmica, mecânica, UV e química somente se documentadas.
- Certificações, laudos e restrições de contato com alimentos.
- Cores oficiais e regra de consistência entre lotes.

### Conteúdo

- Fotos de cada bobina e de cada embalagem.
- Fotos de peças impressas em cada cor sob luz neutra.
- Vídeos curtos, se tiverem qualidade suficiente.
- Perfis de fatiamento testados.
- Fichas técnicas e de segurança.
- Avaliações reais ou plano para começar a coletá-las.

## Modelo de dados recomendado

O catálogo atual é pequeno demais para sustentar a experiência proposta. Cada variante deveria ter uma estrutura próxima desta:

```text
produto
├── marca, fabricante, linha e material
├── slug, SKU, GTIN e grupo de variantes
├── cor, HEX aproximado, acabamento, peso e diâmetro
├── preço, preço Pix, preço anterior e condições
├── estoque, status, prazo de expedição e política de frete
├── galeria por variante e fotos de peças impressas
├── benefícios confirmados e aplicações recomendadas
├── limitações e usos não recomendados
├── parâmetros de impressão e secagem
├── dimensões, pesos e dados da bobina
├── documentos, perfis e versões
├── avaliações e perguntas
└── produtos complementares e kits compatíveis
```

O frontend não deve calcular ou inventar informações que deveriam vir do catálogo, do estoque ou da plataforma de e-commerce.

## Backlog priorizado

| Prioridade | Entrega | Motivo | Dependência |
| --- | --- | --- | --- |
| P1 | Comunicar Masterprint + Triomax | Explica fabricante, revenda e atendimento sem trocar as imagens | Texto e regra de garantia/atendimento |
| P0 | Remover números e alegações ilustrativas | Evitar informação enganosa | Dados reais de avaliação, garantia e envio |
| P0 | Fazer sacola, estoque e CEP funcionarem | Sem isso a página não converte | Plataforma de comércio, frete e inventário |
| P0 | Cadastrar variantes reais | Permite escolher cor/material na página | SKUs, estoque, preços e fotos por variante |
| P0 | Produzir galeria com peças impressas | Mostra o resultado que o cliente compra | Produção fotográfica |
| P0 | Consolidar ficha técnica verdadeira | Base de toda diferenciação | Fornecedor, testes e documentos |
| P1 | Reconstruir galeria e painel de compra | Melhora clareza e hierarquia | Dados P0 |
| P1 | Criar perfil de impressão visível | Reduz insegurança técnica | Parâmetros testados |
| P1 | Criar comparação PLA × PETG | Ajuda o cliente a escolher | Conteúdo técnico validado |
| P1 | Implementar barra de compra mobile | Mantém CTA disponível | Sacola funcional |
| P1 | Exibir prazo e progresso de frete | Reduz incerteza operacional | Integração de frete e carrinho |
| P1 | Criar downloads técnicos | Reforça confiança e pós-venda | Arquivos aprovados |
| P2 | Avaliações com fotos e dados da impressora | Cria prova social útil | Plataforma e moderação |
| P2 | Kits e produtos complementares | Aumenta ticket médio | Regras comerciais e catálogo |
| P2 | Dados estruturados de variantes e oferta | Melhora representação na busca | Dados de produto consistentes |
| P2 | Analytics de interação da PDP | Permite otimização contínua | Consentimento e ferramenta de analytics |

## Sequência de execução recomendada

### Fase 1 — verdade do produto

1. Registrar Masterprint como fabricante e Triomax como revendedora no catálogo.
2. Limpar avaliações e promessas ilustrativas.
3. Reunir ficha técnica, SKUs, estoque, regras e imagens.
4. Modelar produtos e variantes.

### Fase 2 — compra funcional

1. Conectar sacola e checkout.
2. Integrar estoque por variante.
3. Integrar CEP, custo e data estimada.
4. Implementar estados de carregamento, sucesso, erro e indisponibilidade.

### Fase 3 — nova experiência visual

1. Galeria por variante.
2. Novo painel de compra.
3. Seções técnicas e comparação.
4. CTA fixo no mobile.
5. Kits e recomendações por intenção.

### Fase 4 — confiança e otimização

1. Avaliações verificadas e perguntas.
2. Downloads e perfis.
3. Dados estruturados e Merchant Center.
4. Eventos de analytics e testes de conversão.

## Eventos de medição

Além de `view_item`, `add_to_cart` e `begin_checkout`, vale acompanhar:

- `select_product_variant`.
- `view_product_gallery_item`.
- `open_print_profile`.
- `download_technical_document`.
- `calculate_shipping` e resultado do cálculo.
- `click_technical_whatsapp`.
- `view_reviews`.
- `add_bundle_to_cart`.

Principais perguntas para avaliar a nova página:

- Mais visitantes escolhem uma variante e adicionam ao carrinho?
- O uso do cálculo de frete aumenta a conversão ou revela um problema de prazo/preço?
- Clientes que visualizam peça impressa ou perfil técnico convertem mais?
- Quais cores ficam sem estoque ou são abandonadas?
- O suporte recebe menos dúvidas básicas de configuração?

## Critérios de aceite da nova página

A página só deve ser considerada pronta para produção quando:

- Marca, fabricante, foto e título estiverem coerentes.
- Preço, estoque e prazo corresponderem à variante selecionada.
- Cor selecionada atualizar imagem, SKU, URL e disponibilidade.
- Sacola e CEP tiverem estados completos e respostas reais.
- Não houver avaliação, urgência ou promessa ilustrativa.
- Parâmetros técnicos tiverem fonte interna aprovada.
- A galeria incluir ao menos uma peça impressa real.
- A compra for acessível por teclado e leitor de tela.
- O CTA móvel não cobrir conteúdo nem controles do sistema.
- Dados estruturados refletirem exatamente o conteúdo visível.

## Recomendação final

O melhor próximo passo não é começar pelo CSS. Primeiro, a Triomax deve fechar a verdade comercial e técnica de um único produto piloto — por exemplo, PLA Preto 1 kg — e reunir fotos, SKU, estoque, parâmetros e documentos. Depois, construímos a nova página completa para esse produto e usamos o mesmo sistema para todas as variantes.

Isso evita criar uma página visualmente sofisticada sobre dados genéricos e transforma o primeiro produto em um padrão escalável para todo o catálogo.
