import { CartDrawer } from "@/components/site/CartDrawer";
import { CartProvider } from "@/components/site/CartProvider";
import { CartToast } from "@/components/site/CartToast";
import { PontePreviaEditor } from "@/components/site/PontePreviaEditor";
import { listarProdutos } from "@/lib/produtos";
import "../globals.css";

/* O CSS da vitrine vive aqui, e não no root, porque ele reseta `*`, `body`,
   `h1-h4`, `button`, `input` e `a` — o que sobrescreveria os estilos do Nimbus
   no admin. Cada route group carrega o seu. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  /* O catálogo desce por prop porque a sacola é client e precisa resolver
     slug → produto de forma síncrona ao reidratar o localStorage. */
  const catalogo = await listarProdutos();

  return (
    <CartProvider catalogo={catalogo}>
      {children}
      <CartDrawer />
      {/* Adicionar ao carrinho avisa por aqui, em vez de abrir a gaveta. */}
      <CartToast />
      {/* Só age quando a loja está dentro do iframe da prévia do painel. */}
      <PontePreviaEditor />
    </CartProvider>
  );
}
