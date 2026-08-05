"use client";

import { usePathname } from "next/navigation";
import { sair } from "@/app/actions/conta";
import { AccountIcon, BoxIcon, HeartIcon, HouseIcon, LogoutIcon } from "./icons";
import styles from "./conta.module.css";

const SECOES = [
  { href: "/conta", rotulo: "Resumo", Icone: AccountIcon },
  { href: "/conta/pedidos", rotulo: "Meus pedidos", Icone: BoxIcon },
  { href: "/conta/favoritos", rotulo: "Favoritos", Icone: HeartIcon },
  { href: "/conta/enderecos", rotulo: "Endereços", Icone: HouseIcon },
  { href: "/conta/dados", rotulo: "Meus dados", Icone: AccountIcon },
];

/** Menu lateral da conta. É client só por causa do item ativo — `usePathname`
    é a única forma de saber onde estamos sem duplicar a rota em cada página. */
export function ContaMenu() {
  const caminho = usePathname();

  return (
    <nav aria-label="Seções da conta" className={styles.menu}>
      {SECOES.map(({ href, rotulo, Icone }) => {
        /* O resumo casa exato; as demais aceitam subrota, senão o detalhe do
           pedido apagaria o destaque de "Meus pedidos". */
        const ativo = href === "/conta" ? caminho === href : caminho.startsWith(href);
        return (
          <a className={ativo ? styles.menuLinkAtivo : styles.menuLink} href={href} key={href}>
            <Icone />
            <span>{rotulo}</span>
          </a>
        );
      })}

      <form action={sair}>
        <button className={styles.menuSair} type="submit">
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </form>
    </nav>
  );
}
