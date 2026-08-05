"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { alternarFavoritoDaConta } from "@/app/actions/conta";

/*
 * Estado dos favoritos no navegador.
 *
 * A lista não desce com o HTML de propósito: lê-la no servidor tornaria a
 * listagem e as páginas de produto dinâmicas, e hoje elas são estáticas — o que
 * é metade da velocidade da loja. Aqui ela chega depois, por fetch, e só quando
 * existe algum coração na tela: página sem favorito nenhum não faz requisição.
 */

type Contexto = {
  /** `null` enquanto não carregou — o coração fica vazio, sem piscar. */
  ids: Set<string> | null;
  garantirCarregado: () => void;
  alternar: (produtoId: string) => Promise<boolean | null>;
};

const FavoritosContext = createContext<Contexto | null>(null);

export function FavoritosProvider({
  children,
  iniciais,
}: {
  children: React.ReactNode;
  /** A página de favoritos já tem a lista do servidor e passa por aqui, para
      não repetir a busca. */
  iniciais?: string[];
}) {
  const [ids, setIds] = useState<Set<string> | null>(
    iniciais ? new Set(iniciais) : null,
  );
  /* Ref, e não estado: várias montagens de coração acontecem no mesmo tick, e
     um estado só marcaria "buscando" no render seguinte — tarde demais para
     evitar a segunda chamada. */
  const buscando = useRef(Boolean(iniciais));

  const garantirCarregado = useCallback(() => {
    if (buscando.current) return;
    buscando.current = true;

    fetch("/api/conta/favoritos")
      .then((resposta) => (resposta.ok ? resposta.json() : { ids: [] }))
      .then((dados: { ids?: string[] }) => setIds(new Set(dados.ids ?? [])))
      /* Falhou: segue com lista vazia. Coração vazio numa loja funcionando é
         melhor que erro na tela por causa de um enfeite. */
      .catch(() => setIds(new Set()));
  }, []);

  const alternar = useCallback(async (produtoId: string) => {
    const resultado = await alternarFavoritoDaConta(produtoId);
    if (resultado === null) return null;

    setIds((atual) => {
      const proximo = new Set(atual ?? []);
      if (resultado) proximo.add(produtoId);
      else proximo.delete(produtoId);
      return proximo;
    });
    return resultado;
  }, []);

  const valor = useMemo(
    () => ({ ids, garantirCarregado, alternar }),
    [ids, garantirCarregado, alternar],
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

/** `null` fora do provider — o coração some em vez de derrubar a página. */
export function useFavoritos() {
  return useContext(FavoritosContext);
}
