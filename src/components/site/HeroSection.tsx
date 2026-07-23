"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./HeaderHero.module.css";

/* A arte de desktop é 3:1 e a de celular é 1:1 — não é a mesma imagem
   redimensionada, é outro enquadramento. O <picture> abaixo deixa o navegador
   baixar só a versão que vai usar. */
const MOBILE_MEDIA = "(max-width: 767px)";

/*
 * Os banners saem do script de assets em várias larguras a partir de um master
 * 4K. Com `sizes="100vw"` o navegador cruza a largura da janela com o DPR da
 * tela e baixa só um arquivo: 1920 num monitor comum, 3840 num Retina. Servir um
 * arquivo único obrigaria a escolher entre penalizar todo mundo com 4K ou
 * deixar as telas boas sem nitidez.
 */
const desktopSrcSet = (name: string) =>
  [1920, 2560, 3840].map((w) => `/banners/${name}-${w}.webp ${w}w`).join(", ");

const mobileSrcSet = (name: string) =>
  [780, 1170].map((w) => `/banners/mobile/${name}-${w}.webp ${w}w`).join(", ");

export type BannerHero = {
  /** Nome-base do arquivo; as larguras são montadas no srcset acima. */
  name: string;
  alt: string;
  /** aria-label do botão de navegação do slide. */
  label: string;
  link: string;
};

/*
 * Os arquivos são nomeados pelo conteúdo, não pela posição: a ordem do
 * carrossel é a ordem da lista e mais nada. Reordenar vira mover uma entrada no
 * painel, sem renomear arquivo. Isso também evita o problema que motivou a
 * mudança — os estáticos são servidos com `max-age=86400`, então trocar o
 * conteúdo de um mesmo nome deixava o navegador exibindo a arte antiga por 24h.
 *
 * Esta lista é só a rede de segurança: sem banner vindo do banco o hero ficaria
 * com o vídeo sozinho, então caímos no que a loja já exibia.
 */
const BANNERS_PADRAO: BannerHero[] = [
  {
    name: "banner-pla-petg-novo",
    alt: "Banner Triomax: carretéis de filamento laranja, verde, azul, amarelo e preto empilhados sobre fundo bege — PLA e PETG sem pedido mínimo",
    label: "Ver banner de PLA e PETG sem pedido mínimo",
    link: "/produtos",
  },
  {
    name: "banner-confianca",
    alt: "Banner Triomax: prateleira de estoque com carretéis de filamento coloridos empilhados — confiança e entrega rápida, garanta agora",
    label: "Ver banner de ofertas",
    link: "/produtos",
  },
  {
    name: "banner-filamentos",
    alt: "Banner Triomax: impressora 3D imprimindo uma peça laranja, com carretéis ao redor — filamentos e equipamentos com desconto exclusivo",
    label: "Ver banner de filamentos e equipamentos",
    link: "/produtos",
  },
];

const BANNER_DURATION = 6000;

/*
 * O vídeo tem duas versões, como os banners: 16:9 no desktop e 1:1 no celular.
 * Diferente das imagens, aqui não dá para usar `<source media>` — os
 * navegadores removeram o suporte a media query dentro de `<video>`, e o
 * elemento simplesmente pega o primeiro `<source>` da lista. Por isso a escolha
 * é feita em JS.
 */
const videoSources = {
  desktop: { src: "/banners/hero-filaments.mp4", poster: "/banners/hero-poster.webp" },
  mobile: { src: "/banners/mobile/hero-filaments.mp4", poster: "/banners/mobile/hero-poster.webp" },
};

export function HeroSection({ banners: doBanco }: { banners?: BannerHero[] }) {
  const banners = doBanco?.length ? doBanco : BANNERS_PADRAO;
  /* 0 = vídeo; 1..n = banners */
  const slideCount = banners.length + 1;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [slide, setSlide] = useState(0);
  /*
   * Começa nulo de propósito: no HTML do servidor não há como saber a largura
   * da tela, e escolher errado faria o celular baixar os 4K do desktop antes de
   * corrigir. Sem `src` o `<video>` não baixa nada e o poster já pinta o hero;
   * o efeito abaixo resolve a versão certa no primeiro frame do cliente.
   */
  const [source, setSource] = useState<{ src: string; poster: string } | null>(null);

  const next = useCallback(() => setSlide((current) => (current + 1) % slideCount), [slideCount]);

  /*
   * Arrastar para o lado troca de slide no celular. O gesto só conta como
   * horizontal se andar mais no eixo X que no Y — sem isso, rolar a página com
   * o dedo em diagonal viraria troca de banner. O `dragged` existe porque os
   * slides são links: sem ele, soltar o dedo no fim do arrasto abriria
   * /produtos junto.
   */
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const handlePointerDown = (event: React.PointerEvent) => {
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragged.current = false;
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;

    dragged.current = true;
    setSlide((current) => (current + (dx < 0 ? 1 : slideCount - 1)) % slideCount);
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  };

  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA);
    const pick = () => setSource(query.matches ? videoSources.mobile : videoSources.desktop);
    pick();
    // Cobre rotação de tela e redimensionamento de janela atravessando o breakpoint.
    query.addEventListener("change", pick);
    return () => query.removeEventListener("change", pick);
  }, []);

  useEffect(() => {
    if (slide !== 0) {
      const timer = setTimeout(next, BANNER_DURATION);
      return () => clearTimeout(timer);
    }

    // O play precisa acontecer aqui, e não junto com o clique/timer: só depois
    // deste render o slide do vídeo deixa de ser `display: none`, e alguns
    // navegadores recusam reproduzir um elemento que ainda não está renderizado.
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {
      /* autoplay bloqueado — o timer abaixo mantém o carrossel girando */
    });

    // Rede de segurança: se o vídeo não tocar (autoplay bloqueado, decodificação
    // falha, aba em segundo plano), `onEnded` nunca dispara e o carrossel ficaria
    // parado no primeiro frame. Este timer garante que ele sempre avança.
    const limit = Number.isFinite(video.duration) ? video.duration * 1000 : BANNER_DURATION;
    const fallback = setTimeout(next, limit + 1500);
    return () => clearTimeout(fallback);
    // `source` entra nas dependências porque no primeiro render ele ainda é
    // nulo: sem isso o play() rodaria uma única vez num <video> sem src e o
    // primeiro slide ficaria parado no poster até o carrossel dar a volta.
  }, [slide, next, source]);

  return (
    <section
      aria-label="Destaques Triomax"
      className={styles.hero}
      /* Nomeia o bloco para o editor de layout do painel; ver PontePreviaEditor. */
      data-bloco="slider"
      onClickCapture={handleClickCapture}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div
        aria-hidden={slide !== 0}
        className={`${styles.heroSlide} ${slide === 0 ? styles.heroSlideActive : ""}`}
      >
        <video
          aria-label="Filamentos coloridos ao redor da marca Triomax"
          autoPlay
          className={styles.heroVideo}
          muted
          onEnded={next}
          playsInline
          /* O poster é o primeiro frame do próprio vídeo: o hero pinta
             imediatamente e o MP4 entra por cima quando termina de baixar, sem
             o retângulo preto que aparecia enquanto o vídeo carregava. */
          poster={source?.poster ?? videoSources.desktop.poster}
          preload="auto"
          ref={videoRef}
          /* `key` força o React a recriar o elemento na troca de versão, em vez
             de só editar o src — sem isso o Chrome mantém o buffer do vídeo
             antigo e o primeiro frame após a virada sai do arquivo errado. */
          key={source?.src ?? "pending"}
        >
          {source ? <source src={source.src} type="video/mp4" /> : null}
        </video>
      </div>

      {banners.map((banner, index) => {
        const active = slide === index + 1;
        return (
          <a
            aria-hidden={!active}
            className={`${styles.heroSlide} ${styles.heroBannerSlide} ${
              active ? styles.heroSlideActive : ""
            }`}
            href={banner.link}
            key={banner.name}
            tabIndex={active ? 0 : -1}
          >
            <picture>
              <source
                media={MOBILE_MEDIA}
                sizes="100vw"
                srcSet={mobileSrcSet(banner.name)}
                width={1170}
                height={1170}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={banner.alt}
                className={styles.heroBannerImage}
                height={1365}
                /* todos os slides aparecem nos primeiros ~20s; em `lazy` eles só
                   baixariam ao ficarem visíveis, piscando em branco na troca */
                loading="eager"
                /* `sizes="100vw"` porque o hero é full-bleed: o navegador cruza a
                   largura da janela com o DPR e baixa um arquivo só da lista. */
                sizes="100vw"
                src={`/banners/${banner.name}-1920.webp`}
                srcSet={desktopSrcSet(banner.name)}
                width={4096}
              />
            </picture>
          </a>
        );
      })}

      <div aria-label="Trocar destaque" className={styles.heroDots} role="group">
        {Array.from({ length: slideCount }, (_, index) => (
          <button
            aria-label={index === 0 ? "Ver vídeo" : banners[index - 1].label}
            aria-pressed={slide === index}
            className={slide === index ? styles.heroDotActive : ""}
            key={index}
            onClick={() => setSlide(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
