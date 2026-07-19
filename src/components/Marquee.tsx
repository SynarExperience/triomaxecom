import { BoxIcon, CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";
import styles from "./HeaderHero.module.css";

const messages = [
  { Icon: CardIcon, text: "Até 12x sem juros" },
  { Icon: PixIcon, text: "10% de desconto no Pix" },
  { Icon: TruckIcon, text: "Frete grátis acima de R$ 299" },
  { Icon: BoxIcon, text: "Envio para todo o Brasil" },
  { Icon: ShieldIcon, text: "Compra 100% segura" },
];

export function AnnouncementMarquee() {
  return (
    <div aria-label="Avisos da loja" className={styles.marquee} role="marquee">
      <div className={styles.marqueeTrack}>
        {[0, 1].map((group) => (
          <div aria-hidden={group === 1} className={styles.marqueeGroup} key={group}>
            {messages.map(({ Icon, text }) => (
              <span className={styles.marqueeItem} key={text}>
                <Icon />
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
