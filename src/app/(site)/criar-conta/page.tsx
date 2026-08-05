import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormCriarConta } from "@/components/site/FormCriarConta";
import { PaginaAcesso } from "@/components/site/PaginaAcesso";
import { usuarioAtual } from "@/lib/conta";

export const metadata: Metadata = {
  title: "Criar conta — Triomax",
  robots: { index: false, follow: false },
};

function destinoSeguro(valor?: string) {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : "/conta";
}

export default async function CriarContaRoute({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;
  const caminho = destinoSeguro(destino);

  if (await usuarioAtual()) redirect(caminho);

  return (
    <PaginaAcesso
      kicker="Minha conta"
      rodape={
        <>
          Já tem conta?{" "}
          <a href={`/entrar?destino=${encodeURIComponent(caminho)}`}>Entrar</a>
        </>
      }
      texto="Leva um minuto. Depois é só escolher o endereço salvo e finalizar."
      titulo="Criar conta"
    >
      <FormCriarConta destino={caminho} />
    </PaginaAcesso>
  );
}
