import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FavoritosProvider } from "@/components/site/FavoritosProvider";
import { HeartIcon } from "@/components/site/icons";
import { ProductCard } from "@/components/site/ProductCard";
import { contaAtual, idsFavoritos } from "@/lib/conta";
import { listarProdutos } from "@/lib/produtos";
import styles from "@/components/site/conta.module.css";

export const metadata: Metadata = {
  title: "Meus favoritos — Triomax",
  robots: { index: false, follow: false },
};

export default async function FavoritosDaContaRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta/favoritos");

  const [ids, catalogo] = await Promise.all([
    idsFavoritos(conta.cliente.id),
    listarProdutos(),
  ]);

  /* Percorre os ids, e não o catálogo, para manter a ordem de quando cada um
     foi salvo. Produto tirado do ar simplesmente some da lista. */
  const porId = new Map(catalogo.map((produto) => [produto.id, produto]));
  const favoritos = ids.map((id) => porId.get(id)).filter((produto) => produto !== undefined);

  return (
    <section className={styles.cartao}>
      <div className={styles.secaoTopo}>
        <h2 className={styles.cartaoTitulo}>Meus favoritos</h2>
        <a className={styles.verTudo} href="/produtos">
          Ver catálogo
        </a>
      </div>

      {favoritos.length === 0 ? (
        <div className={styles.vazio}>
          <HeartIcon />
          <p className={styles.vazioTitulo}>Nenhum favorito ainda</p>
          <p className={styles.vazioTexto}>
            Toque no coração de qualquer produto para guardá-lo aqui e achar rápido depois.
          </p>
          <a className={styles.botao} href="/produtos">
            Ver produtos
          </a>
        </div>
      ) : (
        /* Provider próprio, já com a lista pronta: aqui ela veio do servidor e
           refazer a busca no navegador seria trabalho repetido. */
        <FavoritosProvider iniciais={ids}>
          <div className={styles.gradeFavoritos}>
            {favoritos.map((produto) => (
              <ProductCard key={produto.id} product={produto} />
            ))}
          </div>
        </FavoritosProvider>
      )}
    </section>
  );
}
