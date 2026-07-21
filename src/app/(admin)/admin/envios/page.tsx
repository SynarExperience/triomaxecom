import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Envios"
      descricao="Transportadoras, etiquetas, prazos e rastreio."
      rotasReais={["/admin/apps/nuvemenvio (micro-frontend em iframe)", "/admin/settings/shipping-methods"]}
    />
  );
}
