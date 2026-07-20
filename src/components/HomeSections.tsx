import { categoryCards, featuredProducts, products } from "@/data/catalog";
import {
  ArrowRightIcon,
  FlameIcon,
  InstagramIcon,
} from "./icons";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

export function FeaturedProducts() {
  return (
    <section className={styles.section} id="colecao">
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>Filamentos Triomax</p>
            <h2 className={styles.sectionTitle}>Nossos filamentos</h2>
          </div>
          <a className={styles.sectionLink} href="/produtos">
            Ver tudo
            <ArrowRightIcon />
          </a>
        </Reveal>
        <div className={styles.productGrid}>
          {featuredProducts.slice(0, 4).map((product, index) => (
            <Reveal delay={index * 80} key={product.slug}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryShowcase() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`} id="categorias">
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>Navegue por material</p>
            <h2 className={styles.sectionTitle}>Escolha sua linha</h2>
          </div>
        </Reveal>
        <div className={styles.categoryGrid}>
          {categoryCards.map((category, index) => (
            <Reveal delay={index * 90} key={category.title}>
              <a className={styles.categoryCard} href={category.href}>
                <span className={styles.categoryCardMedia}>
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      aria-hidden="true"
                      className="productPhoto"
                      loading="lazy"
                      /* O tile renderiza a 485 CSS no desktop, o que pede 970 px
                         em tela 2x — daí a versão de 1024. `sizes` descreve a
                         grade: duas colunas no desktop, uma no celular. */
                      sizes="(max-width: 767px) 50vw, 485px"
                      src={`${category.image}-512.webp`}
                      srcSet={`${category.image}-512.webp 512w, ${category.image}-1024.webp 1024w`}
                    />
                  ) : null}
                </span>
                <span className={styles.categoryCardBody}>
                  <h3>{category.title}</h3>
                  <p>{category.subtitle}</p>
                  <span className={styles.categoryCardCta}>
                    Explorar
                    <ArrowRightIcon />
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/*
 * O bloco inteiro é a arte, de ponta a ponta da tela — mesmo tratamento do hero.
 * Fica fora de `.container` de propósito: assim a largura total vem do próprio
 * fluxo do documento, sem `100vw`, que em desktop conta a barra de rolagem junto
 * e criaria rolagem horizontal.
 *
 * O `alt` carrega a oferta porque ela só existe dentro do pixel: sem ele, quem
 * usa leitor de tela e o próprio Google não teriam como saber o que o banner
 * anuncia.
 */
export function PromoBanner() {
  return (
    <section className={styles.promoSection}>
      <Reveal>
        <a className={styles.promoImageLink} href="/produtos">
          <picture>
            <source
              media="(max-width: 767px)"
              sizes="100vw"
              srcSet="/promo/frete-gratis-mobile-780.webp 780w, /promo/frete-gratis-mobile-1170.webp 1170w"
              width={1170}
              height={1170}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Frete grátis acima de 15 unidades — filamento Masterprint branco e peças impressas em 3D"
              className={styles.promoImage}
              height={1280}
              loading="lazy"
              /* `sizes="100vw"` porque o bloco vai de ponta a ponta: o navegador
                 cruza a largura da janela com o DPR e baixa uma versão só. */
              sizes="100vw"
              src="/promo/frete-gratis-desktop-1920.webp"
              srcSet="/promo/frete-gratis-desktop-1440.webp 1440w, /promo/frete-gratis-desktop-1920.webp 1920w, /promo/frete-gratis-desktop-2560.webp 2560w, /promo/frete-gratis-desktop-3840.webp 3840w"
              width={3840}
            />
          </picture>
        </a>
      </Reveal>
    </section>
  );
}

export function PrintersRail() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>Linha completa</p>
            <h2 className={styles.sectionTitle}>Todos os materiais</h2>
          </div>
          <a className={styles.sectionLink} href="/produtos">
            Ver todos
            <ArrowRightIcon />
          </a>
        </Reveal>
        <Reveal>
          <div aria-label="Lista de filamentos" className={styles.rail} role="list">
            {products.map((product) => (
              <div key={product.slug} role="listitem">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/*
 * Fica isolado aqui porque aparece em três lugares (kicker, botão "Seguir
 * perfil" e o link de cada post) — sem isso, mudar o perfil viraria caça a
 * strings soltas pelo arquivo.
 */
const INSTAGRAM_HANDLE = "triomaxx_";
const INSTAGRAM_PROFILE = `https://instagram.com/${INSTAGRAM_HANDLE}`;

type InstagramPost = {
  /** Código do post no Instagram; nomeia o arquivo e monta o link. */
  code: string;
  /** Descreve a imagem para quem usa leitor de tela. */
  alt: string;
};

/*
 * Posts reais do perfil. As imagens vieram das meta tags Open Graph de cada
 * post, na página de incorporação oficial. A og:image não serve aqui: ela vem
 * recortada em quadrado, cortando topo e base de fotos publicadas em 3:4.
 * Ficam salvas em /public/instagram, servidas do nosso domínio — a CDN do
 * Instagram assina as URLs com validade curta, então apontar direto para lá
 * deixaria a grade quebrada em poucos dias.
 */
const instagramPosts: InstagramPost[] = [
  { code: "DW1w2awmkL0", alt: "Porta-guardanapos impresso em 3D no formato de folha de Costela de Adão" },
  { code: "DW15D3cmkJk", alt: "Réplica impressa em 3D da taça da Copa do Mundo" },
  { code: "DW2HANxmv7D", alt: "Expositor decorativo impresso em 3D com a palavra HOME" },
  { code: "DW1vI7pmiBj", alt: "Escultura minimalista Duos, com dois rostos em união" },
  { code: "DW1rPqhGhnS", alt: "Suporte de joias impresso em 3D no formato de mão" },
  { code: "DW1pH4cFll9", alt: "Busto branco de lobo impresso em 3D" },
];

export function InstagramSection() {
  return (
    <section className={styles.section} id="instagram">
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>@{INSTAGRAM_HANDLE}</p>
            <h2 className={styles.sectionTitle}>No Instagram</h2>
          </div>
          <a
            className={styles.sectionLink}
            href={INSTAGRAM_PROFILE}
            rel="noreferrer"
            target="_blank"
          >
            Seguir perfil
            <ArrowRightIcon />
          </a>
        </Reveal>
        <div className={styles.instaGrid}>
          {instagramPosts.map((post, index) => (
            <Reveal delay={index * 60} key={post.code}>
              <a
                aria-label={`${post.alt} — abrir no Instagram`}
                className={styles.instaTile}
                href={`https://www.instagram.com/p/${post.code}/`}
                rel="noreferrer"
                target="_blank"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={post.alt} loading="lazy" src={`/instagram/${post.code}.webp`} />
                <span className={styles.instaTileOverlay} aria-hidden="true">
                  <InstagramIcon />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
