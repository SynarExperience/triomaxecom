"use client";

import { useEffect, useRef, useState } from "react";
import { sair } from "@/app/actions/conta";
import { carregarSessao, esquecerSessao, type SessaoConta } from "@/lib/sessao-cliente";
import {
  AccountIcon,
  BoxIcon,
  HeartIcon,
  HouseIcon,
  LogoutIcon,
  NoteIcon,
  TrackingIcon,
} from "./icons";
import styles from "./HeaderHero.module.css";

/*
 * Menu da conta no cabeçalho — o que abre ao clicar no bonequinho.
 *
 * A sessão é buscada no PRIMEIRO clique, não na renderização: o HTML do
 * cabeçalho é o mesmo para todo mundo, então as páginas de produto continuam
 * estáticas. Quem nunca abre o menu não paga requisição nenhuma.
 *
 * Enquanto a resposta não chega, o menu já mostra as opções de quem não está
 * logado. É o estado mais provável (a maioria das visitas é anônima) e o mais
 * seguro: no pior caso alguém logado vê "Entrar" por um instante — não o
 * contrário, que seria mostrar "Olá, Fulano" a um visitante.
 */
export function MenuConta() {
  const [aberto, setAberto] = useState(false);
  const [sessao, setSessao] = useState<SessaoConta | null>(null);
  const [destino, setDestino] = useState("/conta");
  const caixa = useRef<HTMLDivElement>(null);

  const abrir = () => {
    /* O destino sai de window, e não de useSearchParams: o hook obrigaria uma
       fronteira de Suspense e tiraria as páginas estáticas do prerender. */
    setDestino(`${window.location.pathname}${window.location.search}`);
    setAberto(true);
    void carregarSessao().then(setSessao);
  };

  useEffect(() => {
    if (!aberto) return;

    const foraDaCaixa = (evento: MouseEvent) => {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false);
    };
    const noEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", foraDaCaixa);
    document.addEventListener("keydown", noEscape);
    return () => {
      document.removeEventListener("mousedown", foraDaCaixa);
      document.removeEventListener("keydown", noEscape);
    };
  }, [aberto]);

  const logado = sessao?.logado === true;
  const paraEntrar = `/entrar?destino=${encodeURIComponent(destino)}`;
  const paraCriar = `/criar-conta?destino=${encodeURIComponent(destino)}`;

  return (
    <div className={styles.contaWrap} ref={caixa}>
      <button
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label="Minha conta"
        className={styles.headerIconButton}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        type="button"
      >
        <AccountIcon />
      </button>

      {aberto && (
        <div className={styles.contaMenu} role="menu">
          {logado ? (
            <>
              <p className={styles.contaSaudacao}>
                Olá, {sessao?.nome || "tudo bem"}
              </p>
              <a className={styles.contaLink} href="/conta" role="menuitem">
                <AccountIcon />
                Minha conta
              </a>
              <a className={styles.contaLink} href="/conta/pedidos" role="menuitem">
                <BoxIcon />
                Meus pedidos
              </a>
              <a className={styles.contaLink} href="/conta/favoritos" role="menuitem">
                <HeartIcon />
                Favoritos
              </a>
              <a className={styles.contaLink} href="/conta/enderecos" role="menuitem">
                <HouseIcon />
                Endereços
              </a>
              {/* Onde fica a troca de senha — motivo frequente de abrir este
                  menu, e sem o atalho a pessoa teria que caçar em /conta. */}
              <a className={styles.contaLink} href="/conta/dados" role="menuitem">
                <NoteIcon />
                Meus dados
              </a>
              <form
                action={sair}
                className={styles.contaSairForm}
                /* Some com o "Olá, Maria" na hora do clique: a navegação leva um
                   instante, e o menu não pode seguir cumprimentando quem
                   acabou de sair. */
                onSubmit={() => {
                  esquecerSessao();
                  setSessao(null);
                  setAberto(false);
                }}
              >
                <button className={styles.contaLink} role="menuitem" type="submit">
                  <LogoutIcon />
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <p className={styles.contaSaudacao}>Minha conta</p>
              <a className={styles.contaBotao} href={paraEntrar} role="menuitem">
                Entrar
              </a>
              <p className={styles.contaRodape}>
                Ainda não tem conta?{" "}
                <a href={paraCriar} role="menuitem">
                  Criar agora
                </a>
              </p>
              <a className={styles.contaLink} href="/rastreio" role="menuitem">
                <TrackingIcon />
                Rastrear pedido
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
