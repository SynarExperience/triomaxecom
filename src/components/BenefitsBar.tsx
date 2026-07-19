"use client";

import { useEffect, useRef } from "react";
import { CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

/*
 * O destaque é atribuído, não decorativo: verde é a cor do Pix no site inteiro
 * (mesma dos preços nos cards) e o dourado marca o gancho comercial mais forte.
 * Os outros dois ficam neutros — quatro cores diferentes lado a lado no desktop
 * viram ruído.
 */
const benefits = [
  {
    icon: <TruckIcon />,
    title: "Frete grátis",
    text: "Nas compras acima de R$ 299 para todo o Brasil",
    accent: styles.benefitGold,
  },
  {
    icon: <CardIcon />,
    title: "Até 12x sem juros",
    text: "Parcele no cartão em até 12 vezes",
  },
  {
    icon: <PixIcon />,
    title: "10% off no Pix",
    text: "Desconto aplicado direto no carrinho",
    accent: styles.benefitPix,
  },
  {
    icon: <ShieldIcon />,
    title: "Compra protegida",
    text: "Site seguro e envio em até 24h úteis",
  },
];

const AUTO_ADVANCE = 3800;
const RESUME_AFTER_TOUCH = 7000;
const CAROUSEL_MEDIA = "(max-width: 640px)";

export function BenefitsBar() {
  const trackRef = useRef<HTMLDivElement>(null);

  /*
   * No celular a faixa vira carrossel. O arrasto é a rolagem nativa do próprio
   * contêiner (com scroll-snap), então o gesto funciona sem JS; este efeito só
   * cuida do avanço automático — e sai da frente assim que o dedo encosta, para
   * não brigar com quem está navegando à mão.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const carousel = window.matchMedia(CAROUSEL_MEDIA);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let paused = false;
    let resume: ReturnType<typeof setTimeout>;

    const pause = () => {
      paused = true;
      clearTimeout(resume);
      resume = setTimeout(() => {
        paused = false;
      }, RESUME_AFTER_TOUCH);
    };

    track.addEventListener("pointerdown", pause);
    track.addEventListener("wheel", pause, { passive: true });

    const timer = setInterval(() => {
      if (paused || !carousel.matches || reduced.matches) return;

      const item = track.firstElementChild;
      if (!item) return;

      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = item.getBoundingClientRect().width + gap;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: "smooth" });
    }, AUTO_ADVANCE);

    return () => {
      clearInterval(timer);
      clearTimeout(resume);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("wheel", pause);
    };
  }, []);

  return (
    <section aria-label="Vantagens da loja" className={styles.benefits}>
      <div className={`container ${styles.benefitsGrid}`} ref={trackRef}>
        {benefits.map((benefit, index) => (
          <Reveal
            className={`${styles.benefit} ${benefit.accent ?? ""}`}
            delay={index * 70}
            key={benefit.title}
          >
            <span className={styles.benefitIcon}>{benefit.icon}</span>
            <span className={styles.benefitText}>
              <strong>{benefit.title}</strong>
              <span>{benefit.text}</span>
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
