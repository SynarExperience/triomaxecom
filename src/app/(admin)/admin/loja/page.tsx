import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Loja online"
      descricao="Layout, páginas, menus, filtros e redes sociais da vitrine."
      rotasReais={["/admin/themes", "/admin/pages", "/admin/navigation", "/admin/filters"]}
    />
  );
}
