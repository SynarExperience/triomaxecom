import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EnderecosConta } from "@/components/site/EnderecosConta";
import { contaAtual, listarEnderecos } from "@/lib/conta";

export const metadata: Metadata = {
  title: "Meus endereços — Triomax",
  robots: { index: false, follow: false },
};

export default async function EnderecosDaContaRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/conta/enderecos");

  const enderecos = await listarEnderecos(conta.cliente.id);

  return <EnderecosConta enderecos={enderecos} />;
}
