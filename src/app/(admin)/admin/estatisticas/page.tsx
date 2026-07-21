import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Estatísticas"
      descricao="Relatórios de vendas, produtos, visitas e cupons, com visão em tempo real."
      rotasReais={["/admin/stats/v2/general", "/admin/stats/v2/products", "/admin/stats/v2/sales", "/admin/stats/v2/visits", "/admin/stats/v2/liveview"]}
    />
  );
}
