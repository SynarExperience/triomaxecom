import { CardIcon, CartIcon, CheckIcon, TruckIcon } from "./icons";
import type { CheckoutStep } from "@/types/checkout";
import styles from "./checkout.module.css";

const PASSOS: { id: CheckoutStep; rotulo: string; Icone: typeof CartIcon }[] = [
  { id: "carrinho", rotulo: "Carrinho", Icone: CartIcon },
  { id: "entrega", rotulo: "Entrega", Icone: TruckIcon },
  { id: "pagamento", rotulo: "Pagamento", Icone: CardIcon },
];

/**
 * Indicador dos três passos. É só sinalização: não navega, porque voltar um
 * passo com dados já validados exigiria revalidar o seguinte — na referência
 * ele também é inerte, e cada seção tem o próprio "Alterar".
 */
export function CheckoutStepper({ atual }: { atual: CheckoutStep }) {
  const indiceAtual = PASSOS.findIndex((passo) => passo.id === atual);

  return (
    <nav aria-label="Etapas do pedido" className={styles.stepper}>
      <ol className={styles.stepperTrilha}>
        {PASSOS.map(({ id, rotulo, Icone }, indice) => {
          const concluido = indice < indiceAtual;
          const ativo = indice === indiceAtual;

          return (
            <li
              aria-current={ativo ? "step" : undefined}
              className={[
                styles.passo,
                ativo ? styles.passoAtivo : "",
                concluido ? styles.passoConcluido : "",
              ].filter(Boolean).join(" ")}
              key={id}
            >
              <span className={styles.passoMarca}>
                {concluido ? <CheckIcon /> : <Icone />}
              </span>
              {rotulo}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
