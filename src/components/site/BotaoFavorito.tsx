"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFavoritos } from "./FavoritosProvider";
import { HeartIcon } from "./icons";
import styles from "./conta.module.css";

/**
 * Coração de favorito. Sem conta, leva ao login e volta para a mesma página —
 * fingir que salvou e perder o favorito ao recarregar é pior que pedir login.
 */
export function BotaoFavorito({
  produtoId,
  nome,
  comRotulo = false,
  redondo = false,
}: {
  produtoId: string;
  nome: string;
  /** Variante em linha (página do produto), com texto ao lado do ícone. */
  comRotulo?: boolean;
  /** Variante redonda, para o canto do card de produto. */
  redondo?: boolean;
}) {
  const favoritos = useFavoritos();
  const router = useRouter();
  const [salvando, iniciar] = useTransition();

  /* Só a existência de um coração na tela dispara a busca da lista. */
  useEffect(() => {
    favoritos?.garantirCarregado();
  }, [favoritos]);

  if (!favoritos) return null;

  const favorito = favoritos.ids?.has(produtoId) ?? false;
  const rotulo = favorito ? `Remover ${nome} dos favoritos` : `Salvar ${nome} nos favoritos`;

  const classe = [
    comRotulo ? styles.favoritoLinha : styles.favoritoBotao,
    redondo ? styles.favoritoRedondo : "",
    favorito ? styles.favoritoAtivo : "",
  ]
    .filter(Boolean)
    .join(" ");

  const aoClicar = () =>
    iniciar(async () => {
      const resultado = await favoritos.alternar(produtoId);
      if (resultado !== null) return;

      const destino = `${window.location.pathname}${window.location.search}`;
      router.push(`/entrar?destino=${encodeURIComponent(destino)}`);
    });

  return (
    <button
      aria-label={comRotulo ? undefined : rotulo}
      aria-pressed={favorito}
      className={classe}
      disabled={salvando}
      onClick={aoClicar}
      title={rotulo}
      type="button"
    >
      <HeartIcon preenchido={favorito} />
      {comRotulo && <span>{favorito ? "Salvo" : "Favoritar"}</span>}
    </button>
  );
}
