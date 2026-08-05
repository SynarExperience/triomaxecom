import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/site/CheckoutFlow";
import { contaAtual, enderecoPadrao } from "@/lib/conta";

export const metadata: Metadata = {
  title: "Finalizar compra — Triomax",
  robots: { index: false, follow: false },
};

/**
 * O checkout exige conta. O middleware já manda o visitante para o login com
 * `destino=/checkout`, e o redirect abaixo é a segunda tranca — se o matcher
 * mudar um dia, a página continua fechada em vez de renderizar um formulário
 * que a rota de pagamento recusaria depois.
 *
 * Com login, os dados descem prontos: quem já comprou uma vez só confere e paga.
 */
export default async function CheckoutRoute() {
  const conta = await contaAtual();
  if (!conta) redirect("/entrar?destino=/checkout");

  const padrao = await enderecoPadrao(conta.cliente.id);

  /* O cadastro guarda o nome inteiro numa coluna só; o checkout pede nome e
     sobrenome separados, como o Mercado Pago exige no pagador. */
  const [primeiro = "", ...resto] = conta.cliente.nome.trim().split(/\s+/);

  return (
    <CheckoutFlow
      conta={{
        email: conta.email,
        nome: primeiro,
        sobrenome: resto.join(" "),
        telefone: conta.cliente.telefone,
        documento: conta.cliente.documento,
        endereco: padrao
          ? {
              cep: padrao.cep,
              logradouro: padrao.logradouro,
              bairro: padrao.bairro,
              cidade: padrao.cidade,
              uf: padrao.estado,
              numero: padrao.numero,
              complemento: padrao.complemento,
            }
          : null,
      }}
    />
  );
}
