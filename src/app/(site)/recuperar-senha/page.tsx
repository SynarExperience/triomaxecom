import type { Metadata } from "next";
import { FormRecuperarSenha } from "@/components/site/FormRecuperarSenha";
import { PaginaAcesso } from "@/components/site/PaginaAcesso";

export const metadata: Metadata = {
  title: "Recuperar senha — Triomax",
  robots: { index: false, follow: false },
};

export default async function RecuperarSenhaRoute({
  searchParams,
}: {
  searchParams: Promise<{ expirado?: string }>;
}) {
  const { expirado } = await searchParams;

  return (
    <PaginaAcesso
      kicker="Minha conta"
      rodape={
        <>
          Lembrou a senha? <a href="/entrar">Voltar para o login</a>
        </>
      }
      texto="Digite o e-mail da conta e enviamos um link para criar uma senha nova."
      titulo="Esqueci minha senha"
    >
      <FormRecuperarSenha expirado={expirado === "1"} />
    </PaginaAcesso>
  );
}
