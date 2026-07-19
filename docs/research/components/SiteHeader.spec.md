# SiteHeader Specification — Saint Germain adapted for Triomax

## Overview

- **Target file:** `src/components/SiteHeader.tsx`
- **Styles:** `src/components/HeaderHero.module.css`
- **Desktop screenshot:** `docs/design-references/saintgermainbrand.com.br/header-desktop-playwright.png`
- **Mobile screenshot:** `docs/design-references/saintgermainbrand.com.br/header-mobile-playwright.png`
- **Search state:** `docs/design-references/saintgermainbrand.com.br/header-desktop-search-open.png`
- **Interaction model:** scroll-driven compression + click-driven search and mobile drawer
- **Adaptation:** reproduce layout and behavior, but keep Triomax assets, content and routes.

## DOM Structure

1. `header.siteHeader`
2. Desktop `contactBar` with secondary links split left/right.
3. Desktop `mainBar` with search icon, centered Triomax wordmark and actions.
4. Desktop `categoryBar` with plain uppercase links.
5. Mobile `mobileTopRow` with menu, wordmark, search and bag.
6. Mobile drawer rendered only while open.
7. Search overlay rendered while open, containing input, submit icon and close button.

## Computed Styles — Desktop 1440 px

### Header

- position: `sticky`; top: `-39px`; z-index: `1040`.
- full initial height: `157px`; white background; no shadow.
- transition: `top 300ms`.
- source reference uses Jost; use `var(--font-header)`.
- max content width: `1300px`; horizontal page inset: `15px`.

### Contact bar

- height: `39px`; padding: `8px 0`.
- font: Jost `12px/18px`, weight `400`.
- color: `rgb(138, 138, 138)`.
- left links: `Comprar pelo WhatsApp`, `Atendimento`, `Rastrear pedido`, `FAQ`.
- right links: store icon + `Seja revendedor`; refresh icon + `Troca fácil`.
- links use 24px spacing; right actions use 28px spacing.

### Main brand row

- height: `68px`.
- three-column grid: `1fr auto 1fr`.
- search button at x≈85: transparent 40×40 hit area, 20px icon, no input visible.
- centered brand enlarged to about 241px: use the Triomax gold symbol plus wordmark from `triomax-mark.svg` and `triomax-wordmark.svg`.
- right actions: account and bag icons, 40×40 hit areas; count badge above bag.

### Navigation

- height: `50px`; white background.
- centered flex list; gap around `38px`.
- links: Jost `14px`, weight `400`, black, uppercase, 20px line box; semantic 18px SVG icon before every label.
- content adapted to: `FILAMENTOS`, `PLA`, `PETG`, `MAIS VENDIDOS`, `OFERTAS`, `ACESSÓRIOS`.
- `OFERTAS` uses `#b2012d`; other links use black.
- hover/focus: opacity `0.55`, transition `400ms`.

## Announcement Bar

- Remains a separate `AnnouncementMarquee` component directly below the header and before the hero.
- Black/graphite gradient background, white text, gold alternating messages and separators, height about `38px`.
- Jost `12px`, weight `400`, no wide letter spacing.
- Continuous horizontal loop, paused on hover.
- Triomax messages only: 12x, Pix, frete, envio, compra segura.

## Search State

- Trigger: click search icon; Escape or close button dismisses.
- Overlay: fixed full viewport, z-index above header; backdrop `rgba(0,0,0,.58)`.
- White search band at top, height `80px` desktop.
- Form centered, width `min(560px, calc(100% - 96px))`, height `48px`.
- Input background `#f7f7f7`, no heavy border, 13px muted placeholder.
- Search icon at input right; close button immediately after form.
- Focus input automatically when opened; body scrolling remains available.

## Scroll State

- Desktop/tablet trigger: any page scroll.
- Reference header moves from `top: 0` to approximately `top: -39px`, hiding the contact bar.
- Logo row and category navigation stay visible.
- Mobile stays at `top: 0`; no compression.

## Mobile 390 px

- breakpoint: below `768px`.
- header height: `56px`; sticky top `0`; bottom border `1px solid rgba(0,0,0,.1)`.
- hide contact bar and desktop navigation.
- grid: menu button `44px`, centered wordmark, search button `40px`, bag `40px`.
- wordmark width around `157px`; no separate search input row.
- announcement follows header at about `38px` high.
- drawer opens below the 56px header; white, one-column links, subtle shadow.
- drawer links: 13px uppercase, 50px minimum height, thin dividers.

## Tablet 768 px

- keep desktop three-band structure.
- contact bar `39px`, logo row `62px`, navigation `50px`.
- logo width about `212px`.
- category list scrolls horizontally instead of wrapping.

## States & Accessibility

- Search icon, account, bag and menu need 40–44px hit areas.
- Escape closes search and drawer.
- Closed drawer is not focusable because it is conditionally rendered.
- Focus-visible outline: 2px black with 2px offset.
- Reduced motion removes transitions but preserves final states.
- Search overlay uses `role="dialog"`, `aria-modal="true"` and an explicit label.

## Assets

- `public/brand/triomax-mark.svg`
- `public/brand/triomax-wordmark.svg`
- Existing `SearchIcon`, `AccountIcon`, `BagIcon`, `MenuIcon`, `CloseIcon`.
- `StoreIcon`, `RefreshIcon`, `FilamentIcon`, `LeafIcon`, `ShieldIcon`, `FlameIcon`, `TagIcon` and `WrenchIcon` from `icons.tsx`.
- No Saint Germain logo, font file, photo or proprietary asset is copied.

## Verification

- `npx tsc --noEmit`
- `npm run build`
- Playwright screenshots at 1440×900, 768×900 and 390×844.
