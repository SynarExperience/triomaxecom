"use client";

import { useEffect, useState } from "react";
import type { ItemMenu } from "@/lib/conteudo";
import { carregarSessao, type SessaoConta } from "@/lib/sessao-cliente";
import { useCart } from "./CartProvider";
import { MenuConta } from "./MenuConta";
import {
  AccountIcon,
  BagIcon,
  BoxIcon,
  CloseIcon,
  FilamentIcon,
  FlameIcon,
  HeadsetIcon,
  HelpIcon,
  LeafIcon,
  MenuIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  StoreIcon,
  TagIcon,
  TrackingIcon,
  WhatsAppIcon,
  WrenchIcon,
} from "./icons";
import styles from "./HeaderHero.module.css";

/* Rede de segurança: menu vazio no banco deixaria a barra de categorias sem
   nenhum link, então caímos no que a loja já exibia. */
const NAVEGACAO_PADRAO: ItemMenu[] = [
  { id: "filamentos", rotulo: "Filamentos", destino: "/produtos", destaque: false, subitens: [] },
  { id: "pla", rotulo: "PLA", destino: "/produtos?material=pla", destaque: false, subitens: [] },
  { id: "petg", rotulo: "PETG", destino: "/produtos?material=petg", destaque: false, subitens: [] },
  { id: "mais-vendidos", rotulo: "Mais vendidos", destino: "/produtos?ordem=mais-vendidos", destaque: false, subitens: [] },
  { id: "ofertas", rotulo: "Ofertas", destino: "/produtos?oferta=true", destaque: true, subitens: [] },
  { id: "acessorios", rotulo: "Acessórios", destino: "/produtos?categoria=acessorios", destaque: false, subitens: [] },
];

/*
 * `itens_menu` guarda só rótulo e destino — o painel não escolhe ícone. A barra
 * nasceu com um ícone por item, então deduzimos pelo rótulo e caímos no ícone de
 * filamento quando nada casa: um item novo entra com ícone genérico em vez de
 * ficar com o texto desalinhado dos vizinhos.
 */
const ICONES: [RegExp, typeof FilamentIcon][] = [
  [/oferta|promo/i, TagIcon],
  [/mais vendid/i, FlameIcon],
  [/acess/i, WrenchIcon],
  [/petg/i, ShieldIcon],
  [/\bpla\b/i, LeafIcon],
  [/in[íi]cio|home/i, StoreIcon],
  [/sobre|quem somos/i, HelpIcon],
];

const iconePara = (rotulo: string) =>
  ICONES.find(([padrao]) => padrao.test(rotulo))?.[1] ?? FilamentIcon;

/* O dourado agora vem da coluna `destaque` do banco: deduzir pelo rótulo
   apagaria o realce assim que alguém renomeasse o item pelo painel. */

function Wordmark() {
  return (
    <a aria-label="Triomax — página inicial" className={styles.wordmark} href="/">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className={styles.wordmarkMark} src="/brand/triomax-mark.svg" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Triomax" className={styles.wordmarkText} src="/brand/triomax-wordmark.svg" />
    </a>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-label="Busca de produtos"
      aria-modal="true"
      className={styles.searchOverlay}
      id="site-search-dialog"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="dialog"
    >
      <div className={styles.searchPanel}>
        <form action="/produtos" className={styles.searchForm} method="get" role="search">
          <label className={styles.srOnly} htmlFor="site-search">
            Buscar produtos
          </label>
          <input autoFocus id="site-search" name="q" placeholder="Buscar produtos" type="search" />
          <button aria-label="Pesquisar" className={styles.searchSubmit} type="submit">
            <SearchIcon />
          </button>
        </form>
        <button aria-label="Fechar busca" className={styles.searchClose} onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

const bagLabel = (count: number) => {
  if (count === 0) return "Sacola, nenhum item";
  return count === 1 ? "Sacola, 1 item" : `Sacola, ${count} itens`;
};

export function SiteHeaderClient({ itens }: { itens: ItemMenu[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sessao, setSessao] = useState<SessaoConta | null>(null);
  const { count, openCart } = useCart();

  /* No celular não cabe o bonequinho na barra: a conta entra pela gaveta, e o
     estado dela é buscado quando a gaveta abre. Mesma promessa em cache que o
     menu do desktop usa, então abrir os dois não consulta duas vezes. */
  useEffect(() => {
    if (menuOpen) void carregarSessao().then(setSessao);
  }, [menuOpen]);

  /* A barra é de um nível só; subitens ficam guardados no dado para quando
     houver dropdown, mas não entram nesta marcação. */
  const navigation = itens.length > 0 ? itens : NAVEGACAO_PADRAO;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [searchOpen]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <header className={styles.siteHeader} id="topo">
        <div className={styles.contactBar}>
          <div className={styles.headerContainer}>
            {/*
              O dourado marca só os dois canais comerciais — comprar e revender.
              Os demais são serviço (atendimento, rastreio, dúvidas, troca) e
              ficam em cinza: se tudo brilha, nada se destaca.
            */}
            <div className={styles.topbarLinks}>
              <a className={styles.topbarHighlight} href="https://wa.me/555132768583">
                <WhatsAppIcon />
                Comprar pelo WhatsApp
              </a>
              <a href="mailto:contato@triomaxoficial.com.br">
                <HeadsetIcon />
                Atendimento
              </a>
              <a href="/rastreio">
                <TrackingIcon />
                Rastrear pedido
              </a>
              <a href="#faq">
                <HelpIcon />
                FAQ
              </a>
            </div>
            <div className={styles.topbarLinks}>
              <a className={styles.topbarHighlight} href="#seja-revendedor">
                <StoreIcon />
                Seja revendedor
              </a>
              <a href="/pagina/trocas-e-devolucoes">
                <RefreshIcon />
                Troca fácil
              </a>
            </div>
          </div>
        </div>

        <div className={styles.desktopMainBar}>
          <div className={`${styles.headerContainer} ${styles.mainBarContent}`}>
            <button
              aria-controls="site-search-dialog"
              aria-expanded={searchOpen}
              aria-label="Abrir busca"
              className={styles.headerIconButton}
              onClick={openSearch}
              type="button"
            >
              <SearchIcon />
            </button>
            <Wordmark />
            <div className={styles.customerActions}>
              {/* O menu resolve a sessão no navegador, no primeiro clique — o
                  HTML do cabeçalho segue igual para todos, e as páginas de
                  produto continuam estáticas. */}
              <MenuConta />
              <button
                aria-label={bagLabel(count)}
                className={`${styles.headerIconButton} ${styles.bagLink}`}
                onClick={openCart}
                type="button"
              >
                <BagIcon />
                <span aria-hidden="true">{count}</span>
              </button>
            </div>
          </div>
        </div>

        <nav aria-label="Categorias de produtos" className={styles.categoryBar}>
          <div className={`${styles.headerContainer} ${styles.categoryList}`}>
            {navigation.map((item) => {
              const Icon = iconePara(item.rotulo);
              return (
                <a
                  className={item.destaque ? styles.saleLink : undefined}
                  href={item.destino}
                  key={item.id}
                >
                  <Icon />
                  <span>{item.rotulo}</span>
                </a>
              );
            })}
          </div>
        </nav>

        <div className={styles.mobileHeader}>
          <div className={styles.mobileTopRow}>
            <button
              aria-controls="mobile-category-drawer"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fechar menu de categorias" : "Abrir menu de categorias"}
              className={styles.mobileIconButton}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <Wordmark />
            <button
              aria-controls="site-search-dialog"
              aria-expanded={searchOpen}
              aria-label="Abrir busca"
              className={styles.mobileIconButton}
              onClick={openSearch}
              type="button"
            >
              <SearchIcon />
            </button>
            <button
              aria-label={bagLabel(count)}
              className={`${styles.mobileIconButton} ${styles.mobileBag}`}
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              type="button"
            >
              <BagIcon />
              <span aria-hidden="true">{count}</span>
            </button>
          </div>
          {menuOpen ? (
            <nav aria-label="Categorias de produtos no celular" className={styles.mobileDrawer} id="mobile-category-drawer">
              {/* Enquanto a sessão não responde, mostra o caminho de quem não
                  está logado: é o estado mais provável, e "Entrar" serve para
                  os dois casos — já logado, cai direto na conta. */}
              {sessao?.logado ? (
                <>
                  <a href="/conta" onClick={() => setMenuOpen(false)}>
                    <AccountIcon />
                    <span>{sessao.nome ? `Olá, ${sessao.nome}` : "Minha conta"}</span>
                  </a>
                  <a href="/conta/pedidos" onClick={() => setMenuOpen(false)}>
                    <BoxIcon />
                    <span>Meus pedidos</span>
                  </a>
                </>
              ) : (
                <>
                  <a href="/entrar" onClick={() => setMenuOpen(false)}>
                    <AccountIcon />
                    <span>Entrar</span>
                  </a>
                  <a href="/criar-conta" onClick={() => setMenuOpen(false)}>
                    <TagIcon />
                    <span>Criar conta</span>
                  </a>
                </>
              )}
              {navigation.map((item) => {
                const Icon = iconePara(item.rotulo);
                return (
                  <a
                    className={item.destaque ? styles.saleLink : undefined}
                    href={item.destino}
                    key={item.id}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon />
                    <span>{item.rotulo}</span>
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>
      {searchOpen ? <SearchDialog onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
