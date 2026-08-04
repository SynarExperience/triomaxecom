# Card de vídeo flutuante — extração de voolt3d.com.br

Referência para `src/components/site/VideoWidget.tsx`. Valores medidos com
`getComputedStyle()` em https://voolt3d.com.br/ (viewport 1837×1044).

## O que é

Widget de terceiro: **iShorts** (`video.ishorts.com.br`). Não é código do site
deles — é um script injetado. Aqui foi reimplementado do zero, sem dependência
externa.

## DOM da referência

```
#IS_widget            fixed, z-index 10000
                      transform: translate3d(26px, 678px, 0) scale(1.25)
                      transform-origin: left top
                      transition: transform 200ms ease-out, opacity 400ms
                      touch-action: none   ← é arrastável
├── <span>            absolute, left:100px (= largura do card), z-index 0
│                     height 32.25px, border-radius 0 36px 36px 0
│                     background #4B0099, color #fff
│                     Montserrat 13.4px/500, uppercase
│                     padding 8px 0, white-space: nowrap, overflow hidden
│                     width: 0  →  transition: width 2s, padding 1s
│                     texto: "SITE OFICIAL VOOLT3D!"
└── <div>             relative, z-index 1, 100×155.5px
    │                 border-radius 8px
    │                 border 1.875px solid #fff
    │                 box-shadow 0 0 0 3px #4B0099
    │                 overflow hidden, cursor pointer
    └── <video>       96×152px, object-fit cover
                      autoplay + loop + muted + playsinline, sem controles
                      fonte: …-140p.mp4  (versão minúscula, só para a miniatura)
```

Com o `scale(1.25)` do contêiner, o tamanho **visual** é 125×194px, borda ~2.3px
e anel ~3.75px.

## Comportamentos

| Gatilho | O que acontece |
| --- | --- |
| carregamento | o rótulo sai de trás do card (width 0 → auto) e recolhe depois |
| clique no card | abre o player em tela cheia |
| arrastar | o widget é reposicionável (`touch-action: none`) |

O rótulo estava **expandido** no primeiro screenshot e **width: 0** um minuto
depois — confirma o ciclo abre/recolhe, não um estado fixo.

## Player em tela cheia

```
#IS_overlay        fixed, inset 0, z-index 10001, background rgba(0,0,0,0.8)
#IS_video_single   558×992px  →  exatamente 9:16
                   altura = 95vh (1044 × 0,95 = 991,8)
                   border-radius 18.46px, overflow hidden
```

Controles: som (canto superior esquerdo), fechar × (superior direito),
curtir + compartilhar e a marca "iShorts" (inferior direito).

## O que foi reproduzido e o que mudou

| Referência | Triomax |
| --- | --- |
| roxo `#4B0099` no anel e no rótulo | anel `--ink`, rótulo `--gold-metal` com texto preto |
| Montserrat 13.4px/500 | `--font-display` 12.5px/600, `letter-spacing .12em` |
| `transition: width 2s` | `max-width 1400ms var(--ease-out)` — mesma leitura, menos arrastado |
| widget arrastável | **não reproduzido**: arrastar num card de 125px atrapalha mais do que ajuda |
| curtir / compartilhar / marca iShorts | **não reproduzido**: são da plataforma, não do lojista |
| sem como dispensar | × que esconde o card pela sessão (`sessionStorage`) |
| — | pausa/continua tocando no vídeo, barra de progresso, Esc fecha, `role="dialog"` |
| aparece em todas as páginas | escondido em `/checkout` e `/carrinho` |
