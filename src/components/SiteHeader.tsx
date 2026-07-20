"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import {
  AccountIcon,
  BagIcon,
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

const navigation = [
  { label: "Filamentos", href: "/produtos", icon: FilamentIcon },
  { label: "PLA", href: "/produtos?material=pla", icon: LeafIcon },
  { label: "PETG", href: "/produtos?material=petg", icon: ShieldIcon },
  { label: "Mais vendidos", href: "/produtos?ordem=mais-vendidos", icon: FlameIcon },
  { label: "Ofertas", href: "/produtos?oferta=true", icon: TagIcon, highlighted: true },
  { label: "Acessórios", href: "/produtos?categoria=acessorios", icon: WrenchIcon },
];

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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, openCart } = useCart();

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
              <a href="mailto:contato@triomax.com.br">
                <HeadsetIcon />
                Atendimento
              </a>
              <a href="#rastrear-pedido">
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
              <a href="#troca-facil">
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
              <a aria-label="Minha conta" className={styles.headerIconButton} href="#conta">
                <AccountIcon />
              </a>
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
            {navigation.map(({ highlighted, href, icon: Icon, label }) => (
              <a className={highlighted ? styles.saleLink : undefined} href={href} key={label}>
                <Icon />
                <span>{label}</span>
              </a>
            ))}
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
              {navigation.map(({ highlighted, href, icon: Icon, label }) => (
                <a
                  className={highlighted ? styles.saleLink : undefined}
                  href={href}
                  key={label}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      {searchOpen ? <SearchDialog onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
