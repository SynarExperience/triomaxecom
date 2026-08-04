import { MailboxIcon, MotorbikeIcon, PackageIcon, StoreIcon, TruckIcon } from "./icons";
import type { OpcaoFrete } from "@/types/checkout";
import styles from "./MarcaEntrega.module.css";

/*
 * Como cada forma de entrega se identifica na lista.
 *
 * Vive num componente próprio porque a cotação aparece em dois lugares — o
 * painel de compra da página do produto (`BuyPanel`) e o checkout
 * (`CheckoutFlow`) —, cada um com o seu CSS. Duplicar levaria a listas que
 * divergem com o tempo, que foi exatamente o que aconteceu quando só o checkout
 * ganhou os ícones.
 */

/*
 * Logotipos das transportadoras. Exibir a marca de quem entrega é uso
 * nominativo padrão de e-commerce — o mesmo critério das bandeiras de cartão em
 * `PaymentBrands`.
 *
 * As medidas são a proporção real de cada arquivo a 20px de altura; esticar
 * qualquer uma delas deformaria a marca. Transportadora sem arquivo aqui cai no
 * ícone genérico, com o nome escrito — é o caso da Sr Express (motoboy) e de
 * qualquer uma que a cotação traga amanhã.
 */
const LOGOS = [
  { chave: "correios", nome: "Correios", src: "/logos/correios.png", largura: 96, altura: 20 },
  { chave: "jadlog", nome: "Jadlog", src: "/logos/jadlog.svg", largura: 59, altura: 20 },
];

/**
 * Ícone da forma de entrega.
 *
 * São ícones de interface (Lucide), não logotipos: os Correios só têm vetor
 * público da marca antiga, e a Jadlog nenhum — os arquivos em `/logos` vieram
 * da própria loja. As duas primeiras linhas vêm de campos do pedido; as
 * transportadoras são reconhecidas pelo nome, com o caminhão cobrindo qualquer
 * uma que apareça na cotação amanhã.
 */
export function IconeDaEntrega({ opcao, classe }: { opcao: OpcaoFrete; classe?: string }) {
  if (opcao.retirada) return <StoreIcon className={classe} />;
  if (opcao.motoboy) return <MotorbikeIcon className={classe} />;

  const marca = opcao.transportadora.toLowerCase();
  if (marca.includes("correios")) return <MailboxIcon className={classe} />;
  if (marca.includes("jadlog")) return <PackageIcon className={classe} />;
  return <TruckIcon className={classe} />;
}

/**
 * Identificação da entrega: o logotipo da transportadora quando existe (aí o
 * nome dela sai do texto, senão apareceria duas vezes), e ícone + nome escrito
 * quando não existe.
 *
 * `separador` é o que vai entre transportadora e serviço — o checkout usa
 * ": " e o painel do produto um espaço.
 */
export function MarcaDaEntrega({
  opcao,
  separador = ": ",
}: {
  opcao: OpcaoFrete;
  separador?: string;
}) {
  const marca = opcao.transportadora.toLowerCase();
  const logo =
    opcao.retirada || opcao.motoboy ? undefined : LOGOS.find((l) => marca.includes(l.chave));

  if (logo) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={logo.nome}
          className={styles.logo}
          height={logo.altura}
          src={logo.src}
          width={logo.largura}
        />
        {opcao.servico}
      </>
    );
  }

  return (
    <>
      <IconeDaEntrega classe={styles.icone} opcao={opcao} />
      {opcao.transportadora}
      {separador}
      {opcao.servico}
    </>
  );
}
