import { listarAvisos } from "@/lib/conteudo";
import { BoxIcon, CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";
import styles from "./HeaderHero.module.css";

/*
 * A tabela `avisos` guarda só o texto — o painel não escolhe ícone. A barra
 * nasceu com um ícone por frase, então mantemos a mesma sequência e giramos por
 * posição: com os avisos semeados a barra sai idêntica à versão antiga, e um
 * aviso novo herda o próximo ícone da fila em vez de ficar sem nenhum.
 */
const icones = [CardIcon, PixIcon, TruckIcon, BoxIcon, ShieldIcon];

export async function AnnouncementMarquee({ avisos }: { avisos?: string[] }) {
  /* Aceita os textos por prop (útil quando a página já os carregou) e, sem
     eles, busca por conta própria — assim as páginas seguem só montando
     <AnnouncementMarquee />. */
  const textos = avisos ?? (await listarAvisos()).map((aviso) => aviso.texto);

  // Sem aviso ativo a faixa preta ficaria vazia na tela; melhor não existir.
  if (textos.length === 0) return null;

  return (
    <div aria-label="Avisos da loja" className={styles.marquee} role="marquee">
      <div className={styles.marqueeTrack}>
        {[0, 1].map((group) => (
          <div aria-hidden={group === 1} className={styles.marqueeGroup} key={group}>
            {textos.map((texto, index) => {
              const Icon = icones[index % icones.length];
              return (
                <span className={styles.marqueeItem} key={`${index}-${texto}`}>
                  <Icon />
                  {texto}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
