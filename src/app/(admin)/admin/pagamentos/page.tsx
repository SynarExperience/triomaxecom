import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Pagamentos"
      descricao="Saldo, transferências e histórico de pagamentos por venda."
      rotasReais={["/admin/nuvempago (micro-frontend em iframe)"]}
    />
  );
}
