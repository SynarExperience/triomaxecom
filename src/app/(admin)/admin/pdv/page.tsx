import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Ponto de Venda"
      descricao="Venda presencial integrada ao mesmo estoque e cadastro de clientes."
      rotasReais={["/admin/pos (micro-frontend em iframe)"]}
    />
  );
}
