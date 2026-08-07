"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, PlayIcon, VolumeIcon } from "./icons";
import styles from "./VideoWidget.module.css";

/*
 * Duas versões do mesmo vídeo, como no hero: a miniatura roda em loop na página
 * inteira e precisa ser leve; a versão cheia só baixa quando alguém abre o
 * player. Ver scripts/converter-video-widget.sh.
 */
const PREVIA = "/video/institucional-preview.mp4";
const COMPLETO = "/video/institucional.mp4";

const ROTULO = "Site oficial Triomax!";
const DISPENSADO = "triomax:video-widget-dispensado";

/*
 * Onde o card não aparece.
 *
 * No checkout e na sacola ele só disputaria atenção com a compra. As telas de
 * conta entraram pelo mesmo motivo, agravado: desde que o login virou exigência
 * para finalizar, entrar e cadastrar-se passaram a ser etapas da compra, não
 * passeio pela loja.
 */
const ROTAS_SEM_WIDGET = [
  "/checkout",
  "/carrinho",
  "/conta",
  "/entrar",
  "/criar-conta",
  "/recuperar-senha",
  "/nova-senha",
];

/* O rótulo sai de trás do card, espera e recolhe — quem ignorou na primeira
   vista não fica com uma tarja dourada permanente no canto da tela. */
const ROTULO_ABRE = 1200;
const ROTULO_FECHA = 7000;

export function VideoWidget() {
  const pathname = usePathname();

  const previaRef = useRef<HTMLVideoElement>(null);
  const completoRef = useRef<HTMLVideoElement>(null);
  const fitaRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  const [dispensado, setDispensado] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [rotuloAberto, setRotuloAberto] = useState(false);
  /* Enquanto o MP4 não existir (ou falhar ao decodificar) o card seria um
     retângulo preto no canto da vitrine. Melhor não existir. */
  const [semVideo, setSemVideo] = useState(false);

  /*
   * Começa dispensado e só aparece depois de conferir a sessão: montar visível
   * e esconder no efeito faria o card piscar em toda navegação de quem já
   * tinha fechado.
   */
  useEffect(() => {
    setDispensado(sessionStorage.getItem(DISPENSADO) === "1");
  }, []);

  useEffect(() => {
    if (dispensado) return;
    const abre = setTimeout(() => setRotuloAberto(true), ROTULO_ABRE);
    const fecha = setTimeout(() => setRotuloAberto(false), ROTULO_FECHA);
    return () => {
      clearTimeout(abre);
      clearTimeout(fecha);
    };
  }, [dispensado]);

  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    if (!aberto) {
      // Volta a rodar a miniatura, que foi pausada ao abrir o player.
      previaRef.current?.play().catch(() => {});
      return;
    }

    const video = completoRef.current;
    previaRef.current?.pause();

    const fechaNoEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar();
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fechaNoEsc);
    fecharRef.current?.focus();

    if (video) {
      video.currentTime = 0;
      /*
       * Abre com som: o clique no card é o gesto do usuário que libera o áudio.
       * Ainda assim alguns navegadores recusam (economia de dados, política de
       * mídia mais dura) — nesse caso o vídeo roda mudo, e não parado.
       */
      video.muted = false;
      setMudo(false);
      video.play().then(
        () => setPausado(false),
        () => {
          video.muted = true;
          setMudo(true);
          video.play().catch(() => setPausado(true));
        },
      );
    }

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fechaNoEsc);
      video?.pause();
    };
  }, [aberto, fechar]);

  /*
   * A barra anda por rAF, e não por `timeupdate`: o evento dispara umas quatro
   * vezes por segundo e a fita andaria aos saltos. Escrevo direto no style para
   * não re-renderizar o player 60 vezes por segundo.
   */
  useEffect(() => {
    if (!aberto) return;
    let frame = 0;

    const passo = () => {
      const video = completoRef.current;
      const fita = fitaRef.current;
      if (video && fita && Number.isFinite(video.duration) && video.duration > 0) {
        fita.style.transform = `scaleX(${video.currentTime / video.duration})`;
      }
      frame = requestAnimationFrame(passo);
    };

    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [aberto]);

  const alternarSom = () => {
    const video = completoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMudo(video.muted);
  };

  const alternarPausa = () => {
    const video = completoRef.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPausado(false), () => {});
    else {
      video.pause();
      setPausado(true);
    }
  };

  const dispensar = () => {
    sessionStorage.setItem(DISPENSADO, "1");
    setDispensado(true);
  };

  if (dispensado || semVideo) return null;
  if (ROTAS_SEM_WIDGET.some((rota) => (pathname ?? "").startsWith(rota))) return null;

  return (
    <>
      {/* Com o player aberto o card sai de cena: deixá-lo tocando no canto, atrás
          do véu, é o mesmo vídeo duas vezes na tela. Some por CSS, e não
          desmontando, para o preview não ter de baixar tudo de novo ao fechar. */}
      <div className={`${styles.widget} ${aberto ? styles.widgetOculto : ""}`}>
        {/* Fica antes do card na ordem do DOM só para o z-index: pintado
            depois, o dourado passaria por cima da borda branca. */}
        <span
          aria-hidden
          className={`${styles.rotulo} ${rotuloAberto ? styles.rotuloAberto : ""}`}
        >
          {ROTULO}
        </span>

        <button
          aria-label={`${ROTULO} Assistir ao vídeo.`}
          className={styles.card}
          onClick={() => setAberto(true)}
          type="button"
        >
          <video
            autoPlay
            className={styles.preview}
            loop
            muted
            onError={() => setSemVideo(true)}
            playsInline
            preload="metadata"
            src={PREVIA}
          />
        </button>

        <button
          aria-label="Fechar o vídeo da Triomax"
          className={styles.dispensar}
          onClick={dispensar}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      {aberto ? (
        <div
          aria-label="Vídeo institucional da Triomax"
          aria-modal
          className={styles.overlay}
          /* Clicar no fundo escuro fecha; cliques vindos do player não sobem
             até aqui porque param na camada de toque. */
          onClick={fechar}
          role="dialog"
        >
          <div className={styles.player} onClick={(event) => event.stopPropagation()}>
            <video
              className={styles.playerVideo}
              onEnded={() => setPausado(true)}
              playsInline
              preload="auto"
              ref={completoRef}
              src={COMPLETO}
            />

            <button
              aria-label={pausado ? "Continuar o vídeo" : "Pausar o vídeo"}
              className={`${styles.toque} ${pausado ? styles.pausado : ""}`}
              onClick={alternarPausa}
              type="button"
            >
              <PlayIcon />
            </button>

            <button
              aria-label={mudo ? "Ativar o som" : "Desativar o som"}
              className={`${styles.playerBotao} ${styles.som}`}
              onClick={alternarSom}
              type="button"
            >
              <VolumeIcon muted={mudo} />
            </button>

            <button
              aria-label="Fechar o vídeo"
              className={`${styles.playerBotao} ${styles.fechar}`}
              onClick={fechar}
              ref={fecharRef}
              type="button"
            >
              <CloseIcon />
            </button>

            <div className={styles.progresso}>
              <div className={styles.progressoFita} ref={fitaRef} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
