import ProdutosTabela from "@/components/admin/ProdutosTabela";

/* Rota fina: a UI do Nimbus mora no client component. Mesmo arranjo da tela
   de pedidos — evita que os subcomponentes (Page.Header, Table.Cell) sejam
   acessados de um server component. */
export default function ProdutosPage() {
  return <ProdutosTabela />;
}
