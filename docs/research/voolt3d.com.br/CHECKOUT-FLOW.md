# Fluxo de checkout da Voolt3D — engenharia reversa

Capturado em 22 de julho de 2026 com Playwright (`scripts/inspect-voolt-checkout-*.mjs`).
Loja Nuvemshop/Tiendanube, store `5959122`, tema `flex`.

Telas em `docs/design-references/voolt3d.com.br/` (`desktop-*.png` e `mobile-*.png`).

## Como chegar lá (armadilhas encontradas)

Três obstáculos custaram várias tentativas e estão resolvidos nos scripts:

1. **User-agent.** Sem UA de browser real, `POST /comprar/` responde `403 {"success":false}`
   e o tema traduz isso para `out_of_stock`. Parece produto esgotado, mas é bloqueio de bot:
   *todos* os 48 produtos varridos "falharam" até trocar o UA.
2. **`.js-addtocart` duplicado.** A PDP repete o seletor 18 vezes — um placeholder fixo
   oculto (`js-fixed-product-form`) e os cards da vitrine. O botão real é o visível dentro
   de `form#product_form`.
3. **Checkout é React controlado.** `locator.fill()` seta o valor sem disparar os eventos
   que ele escuta; o campo continua "vazio" para a validação. É preciso `pressSequentially`.

## Topologia do funil

| # | Tela | URL | Modelo de interação |
|---|---|---|---|
| 1 | Vitrine / PDP | `/produtos/`, `/produtos/<slug>/` | POST `add_to_cart` |
| 2 | Notificação flutuante | overlay | `.js-alert-added-to-cart`, canto sup. dir., 290×216 |
| 3 | Carrinho | `/comprar/` | página cheia, `input[name=go_to_checkout]` |
| 4 | Checkout | `/checkout/v3/start/<id>/<hash>` | SPA de 3 passos, mesma URL o tempo todo |

O checkout **não troca de URL entre os passos** — é uma SPA que revela seções conforme
valida. O stepper (Carrinho › Entrega › Pagamento) é indicador, não navegação.

## Tela 3 — Carrinho (`/comprar/`)

Layout desktop em duas colunas: lista de itens à esquerda (~64%), cartão de resumo à
direita (~36%, fundo branco sobre cinza, sem sombra forte).

- Linha do item: thumb ~64px, nome em negrito, stepper `− 1 +`, preço unitário, total à
  direita, lixeira no canto.
- Dentro do cartão de resumo, **antes** do subtotal, vem um bloco de cross-sell
  "Quem viu amoouu" (sic — erro de digitação no site original) com grade 3×2 de produtos,
  cada um com botão "Comprar" e selo "Esgotado" quando aplicável.
- Rodapé do resumo: `Subtotal`, `Total`, linha "Ou R$79,90 com Nuvem Pago",
  botão sólido **Finalizar Compra** e link "Ver mais produtos".
- Carrinho vazio: caixa com borda fina e texto "O carrinho de compras está vazio.
  Ver mais produtos »".

## Tela 4 — Checkout, passo a passo

Cabeçalho próprio: só a logo, centralizada à esquerda, sobre faixa lilás clara. Sem
navegação, sem busca, sem rodapé da loja. Abaixo, o stepper em faixa cinza.

Coluna esquerda ~58% com os formulários; coluna direita ~34% com o resumo do pedido
(item, subtotal, custo de frete quando conhecido, total, "Adicionar cupom de desconto").

### Passo A — Dados de contato + CEP
- `Dados de contato`: campo E-mail (`contact.email`), checkbox "Receber ofertas e
  novidades por e-mail" (`acceptedMarketing`).
- `Entrega`: campo CEP (`shippingAddress.zipcode`) com link "Não sei meu CEP" à direita,
  dentro da mesma borda.
- Botão **CONTINUAR**, alinhado à direita, 280×46, caixa alta.

### Passo B — Frete (revelado após o CEP)
- E-mail vira campo travado cinza com link "Alterar".
- Aparece o cartão "Agilize sua compra / Aproveite seus dados salvos…" (Nuvem Pago).
- `Entrega` lista opções como linhas selecionáveis com quadrado de seleção à esquerda,
  nome + prazo, preço à direita:
  - Mandaê: Econômico — Chega em 3 dias úteis — R$13,81
  - Mandaê: Rápido — Chega em 2 dias úteis — R$14,55
  - J3 Flex - Origem: Sao Bernardo Do Campo-SP — Chega em 2 dias úteis — R$15,00
- Escolhida uma opção, ela ganha borda de destaque e as outras colapsam atrás de
  "Mais opções ⌄". O resumo passa a mostrar `Custo de frete` e o total sobe.

### Passo C — Dados para entrega + nota fiscal
Revelado junto com a escolha do frete, abaixo dele:
- `Dados para entrega`: Nome, Sobrenome, Telefone com DDD, cartão de endereço
  preenchido pelo CEP (logradouro, CEP, bairro, cidade/UF, link "Alterar"),
  Número + checkbox "Sem número", e complemento opcional.
- `Dados para nota fiscal`: campo **CPF ou CNPJ** (obrigatório, valida dígito
  verificador) + checkbox "Usar as mesmas informações da entrega".
- Botão **CONTINUAR PARA PAGAMENTO**.
- Validação inline: barra vermelha sólida colada abaixo do campo, texto branco
  centralizado ("Este campo deve ser preenchido", "Digite um número de CPF ou CNPJ
  válido"). Campo válido ganha ✓ verde à direita.

### Passo D — Forma de pagamento
- Aviso âmbar no topo sobre estimativas de prazo da transportadora.
- Cartão de revisão com quatro linhas iconizadas: e-mail; endereço completo; frete
  escolhido + data ("Chega segunda-feira 27/07"); "Instruções para o pedido" com link
  "Adicionar".
- `Forma de pagamento` — três linhas clicáveis com chevron à direita:
  - Cartão de crédito
  - Pix — selo "Pague R$93,71" (desconto ante o total de R$97,91)
  - Boleto bancário — selo "Pague R$94,55"
- Checkbox "Salvar dados para **comprar mais rápido**" com marca Nuvem, e nota
  "Nas próximas compras enviaremos um código para: (11) 95039-9547 Alterar".
- Botão **FAZER PEDIDO**.

> A captura parou aqui de propósito: nenhum pedido foi confirmado na loja real.

## Adaptação para a Triomax

O que se copia é a **estrutura e a sequência**, não a pele. A Voolt3D é roxa
(`#4b0082`-ish) com Montserrat; a Triomax é preto/branco/dourado com Neulis + Poppins,
já definidos em `globals.css`. Diferenças deliberadas na adaptação:

- Sem "Nuvem Pago" / "Agilize sua compra" — é produto da plataforma deles.
- Desconto no Pix usa o `pixPrice()` que já existe no catálogo (10%), no lugar dos
  percentuais do gateway deles.
- Cross-sell no carrinho vira "Quem comprou levou também", sem o erro de digitação.
- Frete é mockado com as três faixas observadas (econômico, rápido, expresso).
