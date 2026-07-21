import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Instagram e Facebook"
      descricao="Catálogo sincronizado e anúncios nos canais da Meta."
      rotasReais={["/admin/social/meta/"]}
    />
  );
}
