import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Marketing"
      descricao="Automações, campanhas e aplicativos de marketing."
      rotasReais={["/admin/marketing-automation", "/admin/marketing/apps"]}
    />
  );
}
