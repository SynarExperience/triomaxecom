import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormEntrar } from "@/components/site/FormEntrar";
import { PaginaAcesso } from "@/components/site/PaginaAcesso";
import { usuarioAtual } from "@/lib/conta";

export const metadata: Metadata = {
  title: "Entrar na sua conta — Triomax",
  robots: { index: false, follow: false },
};

/** Caminho interno apenas: `destino` vem da URL, e um `//site.com` viraria
    redirecionamento aberto para fora da loja. */
function destinoSeguro(valor?: string) {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : "/conta";
}

export default async function EntrarRoute({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;
  const caminho = destinoSeguro(destino);

  // Quem já está logado não precisa ver o login de novo.
  if (await usuarioAtual()) redirect(caminho);

  return (
    <PaginaAcesso
      kicker="Minha conta"
      rodape={
        <>
          Ainda não tem conta?{" "}
          <a href={`/criar-conta?destino=${encodeURIComponent(caminho)}`}>Criar agora</a>
        </>
      }
      texto="Acompanhe seus pedidos, salve endereços e compre mais rápido."
      titulo="Entrar"
    >
      <FormEntrar destino={caminho} />
    </PaginaAcesso>
  );
}
