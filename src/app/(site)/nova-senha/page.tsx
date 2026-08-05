import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormNovaSenha } from "@/components/site/FormNovaSenha";
import { PaginaAcesso } from "@/components/site/PaginaAcesso";
import { usuarioAtual } from "@/lib/conta";

export const metadata: Metadata = {
  title: "Criar nova senha — Triomax",
  robots: { index: false, follow: false },
};

/* Só se chega aqui com a sessão que o link do e-mail abriu (ou já logado). Sem
   ela o formulário só teria "o link expirou" a dizer, então a pessoa volta
   direto para pedir outro. */
export default async function NovaSenhaRoute() {
  if (!(await usuarioAtual())) redirect("/recuperar-senha?expirado=1");

  return (
    <PaginaAcesso
      kicker="Minha conta"
      texto="Escolha uma senha nova para entrar na loja."
      titulo="Criar nova senha"
    >
      <FormNovaSenha aoTerminar="/conta" />
    </PaginaAcesso>
  );
}
