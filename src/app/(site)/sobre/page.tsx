import type { Metadata } from "next";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import pageStyles from "@/components/site/pages.module.css";

export const metadata: Metadata = {
  title: "Sobre nós | Triomax",
  description:
    "Conheça a Triomax — filamentos de alta performance e impressoras 3D, com curadoria própria e atendimento próximo.",
};

/* Os três pilares que dão nome à TRIOMAX: qualidade, variedade e confiança. */
const valores = [
  {
    titulo: "Qualidade",
    texto:
      "Trabalhamos com os melhores filamentos do mercado, das marcas Masterprint e FusionX, em PLA e PETG. Cada produto é selecionado com precisão, consistência e atenção aos detalhes.",
    resumo: "Filamentos Masterprint e FusionX selecionados com precisão.",
  },
  {
    titulo: "Variedade",
    texto:
      "PLA e PETG nas versões de 1kg e 3kg, em opções de cor pensadas para cada projeto, com o material certo para transformar sua ideia em algo sólido e bem-acabado.",
    resumo: "PLA e PETG em 1kg e 3kg, com cor para cada projeto.",
  },
  {
    titulo: "Confiança",
    texto:
      "Queremos ser o parceiro que você escolhe: aquele em quem confiar para dar forma às suas ideias, camada após camada, com resultado real.",
    resumo: "O parceiro que você escolhe para dar forma às suas ideias.",
  },
];

/* A equipe: fotos individuais (quadradas, 1:1) na ordem definida. */
const equipe = [
  { nome: "Bianka Ferreira", slug: "bianka-ferreira" },
  { nome: "Felipe Galvão", slug: "felipe-galvao" },
  { nome: "Mateus Arana", slug: "mateus-arana" },
];

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main className={`${pageStyles.page} ${pageStyles.pageAbout}`}>
        <div className="container">
          <ol className={pageStyles.breadcrumb}>
            <li>
              <a href="/">Início</a>
            </li>
            <li aria-current="page">Sobre nós</li>
          </ol>

          <Reveal className={pageStyles.aboutHeader}>
            <h1>QUEM SOMOS</h1>
          </Reveal>

          <Reveal>
            <div className={pageStyles.team}>
              {equipe.map((p) => (
                <figure className={pageStyles.teamMember} key={p.slug}>
                  <div className={pageStyles.teamPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={p.nome}
                      sizes="(max-width: 767px) 90vw, 360px"
                      src={`/equipe/${p.slug}-780.webp`}
                      srcSet={`/equipe/${p.slug}-540.webp 540w, /equipe/${p.slug}-780.webp 780w`}
                      width={780}
                      height={780}
                    />
                  </div>
                  <figcaption>{p.nome}</figcaption>
                </figure>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className={pageStyles.aboutLead}>
              <p>
                O nome TRIOMAX nasce de uma ideia simples, mas poderosa: três elementos que,
                juntos, formam algo muito maior do que a soma das partes.
              </p>
              <p>
                Assim como na impressão 3D, onde camada após camada se une para dar forma a algo
                único e resistente, a TRIOMAX foi construída sobre três pilares que sustentam tudo
                o que fazemos: qualidade, variedade e confiança.
              </p>
              <p>
                Trabalhamos com os melhores filamentos do mercado, das marcas Masterprint e
                FusionX, em PLA e PETG, nas versões de 1kg e 3kg. Selecionamos cada produto com o
                mesmo cuidado que um bom projeto exige: camada por camada, com precisão,
                consistência e atenção aos detalhes.
              </p>
              <p>
                Acreditamos que cada impressão é resultado de boas escolhas: de material, de cor,
                de parceiro. E é exatamente isso que queremos ser: o parceiro que você escolhe para
                transformar suas ideias em algo sólido, real e bem-acabado.
              </p>
              <p>
                Na TRIOMAX, cada camada importa. Juntos, formamos um todo equilibrado, pronto para
                moldar o futuro da sua impressão.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className={pageStyles.aboutValues}>
              {valores.map((v) => (
                <div className={pageStyles.valueCard} key={v.titulo}>
                  <h3>{v.titulo}</h3>
                  <p className={pageStyles.valueFull}>{v.texto}</p>
                  <p className={pageStyles.valueShort}>{v.resumo}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
