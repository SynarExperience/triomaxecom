import EmConstrucao from "@/components/admin/EmConstrucao";

export default function Page() {
  return (
    <EmConstrucao
      titulo="Configurações"
      descricao="Dados do negócio, domínios, e-mails automáticos, usuários e fiscal."
      rotasReais={["/admin/preferences", "/admin/settings/*", "/admin/account/*"]}
    />
  );
}
