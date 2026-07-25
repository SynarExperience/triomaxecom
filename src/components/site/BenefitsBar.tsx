"use client";

import { useEffect, useRef } from "react";
import { BoxIcon, CardIcon, PixIcon, ShieldIcon, TruckIcon } from "./icons";
import type { Beneficio } from "@/lib/conteudo";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

/*
 * O painel escolhe a CHAVE do ícone; o desenho fica aqui. Chave desconhecida
 * cai no ícone de caixa, para um benefício novo nunca aparecer sem símbolo.
 */
const icones = {
  frete: TruckIcon,
  cartao: CardIcon,
  pix: PixIcon,
  protegido: ShieldIcon,
};

/*
 * O destaque é atribuído, não decorativo: verde é a cor do Pix no site inteiro
 * (mesma dos preços nos cards) e o dourado marca o gancho comercial mais forte.
 * Os outros dois ficam neutros — quatro cores diferentes lado a lado no desktop
 * viram ruído. Segue a chave do ícone, e não o título, senão renomear o
 * benefício no painel apagaria a cor.
 */
const destaques = {
  frete: styles.benefitGold,
  pix: styles.benefitPix,
};

/* Rede de segurança: tabela `beneficios` vazia deixaria a faixa em branco. */
const padrao: Beneficio[] = [
  {
    id: "frete",
    icone: "frete",
    titulo: "Frete grátis",
    texto: "Nas compras acima de R$ 299 para todo o Brasil",
  },
  {
    id: "cartao",
    icone: "cartao",
    titulo: "Até 12x sem juros",
    texto: "Parcele no cartão em até 12 vezes",
  },
  {
    id: "pix",
    icone: "pix",
    titulo: "Pix aprovado na hora",
    texto: "Pague com Pix e o pedido é confirmado na hora",
  },
  {
    id: "protegido",
    icone: "protegido",
    titulo: "Compra protegida",
    texto: "Site seguro e envio em até 24h úteis",
  },
];

const AUTO_ADVANCE = 3800;
const RESUME_AFTER_TOUCH = 7000;
const CAROUSEL_MEDIA = "(max-width: 640px)";

/* Recebe os benefícios por prop porque a faixa é client (carrossel automático no
   celular) — quem lê o banco é a página, como já acontece com o hero. */
export function BenefitsBar({ beneficios }: { beneficios?: Beneficio[] }) {
  const lista = beneficios && beneficios.length > 0 ? beneficios : padrao;
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
        {lista.map((beneficio, index) => {
          const Icone = icones[beneficio.icone as keyof typeof icones] ?? BoxIcon;
          const destaque = destaques[beneficio.icone as keyof typeof destaques];

          return (
            <Reveal
              className={`${styles.benefit} ${destaque ?? ""}`}
              delay={index * 70}
              key={beneficio.id}
            >
              <span className={styles.benefitIcon}>
                <Icone />
              </span>
              <span className={styles.benefitText}>
                <strong>{beneficio.titulo}</strong>
                <span>{beneficio.texto}</span>
              </span>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
