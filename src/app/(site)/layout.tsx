import { CartDrawer } from "@/components/site/CartDrawer";
import { CartProvider } from "@/components/site/CartProvider";
import "../globals.css";

/* O CSS da vitrine vive aqui, e não no root, porque ele reseta `*`, `body`,
   `h1-h4`, `button`, `input` e `a` — o que sobrescreveria os estilos do Nimbus
   no admin. Cada route group carrega o seu. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
