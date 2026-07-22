import { listarProdutos } from "@/lib/produtos";
import {
  ArrowRightIcon,
  FlameIcon,
  InstagramIcon,
} from "./icons";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

export async function FeaturedProducts() {
  const featuredProducts = await listarProdutos();

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
        <div className={`${styles.productGrid} ${styles.featuredScroller}`}>
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

/*
 * Grid de destaques no lugar dos tiles de categoria:
 *   ┌──────────────┬────────┐
 *   │  Sobre nós   │        │
 *   ├──────────────┤ aberto │   (a terceira célula é um placeholder até a
 *   │ Frete grátis │        │    arte definitiva — as medidas saem no admin
 *   └──────────────┴────────┘    e no comentário abaixo)
 *
 * As duas células da esquerda têm proporção 21/9; a da direita herda a altura
 * das duas somadas. Frete usa `object-fit: cover`, então a arte 3:1 atual é
 * cortada no preview — a arte final deve vir no tamanho reportado.
 */
export function FeatureGrid() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`} id="destaques">
      <div className="container">
        <Reveal>
          <div className={styles.featureGrid}>
            {/* Sobre nós */}
            <a className={`${styles.featureCell} ${styles.featureWideTop}`} href="/sobre">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Sobre nós — equipe Triomax"
                loading="lazy"
                sizes="(max-width: 767px) 100vw, 832px"
                src="/banners/destaque-sobre-1664.webp"
                srcSet="/banners/destaque-sobre-780.webp 780w, /banners/destaque-sobre-1664.webp 1664w"
              />
            </a>

            {/* Frete grátis */}
            <a className={`${styles.featureCell} ${styles.featureWideBottom}`} href="/produtos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Frete grátis acima de 15 unidades"
                loading="lazy"
                sizes="(max-width: 767px) 100vw, 832px"
                src="/banners/destaque-frete-1664.webp"
                srcSet="/banners/destaque-frete-780.webp 780w, /banners/destaque-frete-1664.webp 1664w"
              />
            </a>

            {/* Impressoras com desconto (banner alto). A arte é 543×1270 (0,43:1),
                mais estreita que a célula (~0,57:1), então object-fit corta topo
                e base — ver se agrada antes do upscale. */}
            <a className={`${styles.featureCell} ${styles.featureTall}`} href="/produtos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Impressoras 3D com desconto"
                loading="lazy"
                sizes="(max-width: 767px) 33vw, 416px"
                src="/banners/destaque-impressoras-832.webp"
                srcSet="/banners/destaque-impressoras-480.webp 480w, /banners/destaque-impressoras-832.webp 832w"
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/*
 * Faixa de tiles logo abaixo da barra de benefícios. O layout nasceu como cópia
 * da home do voolt3d.com.br, mas a arte agora é nossa — os tiles anteriores
 * traziam o logo Voolt3D nos carretéis e serviam só para comparar layout.
 */
type StripTile = {
  /** Nomeia o par de arquivos em /banners/category-strip. */
  slug: string;
  label: string;
};

const stripTiles: StripTile[] = [
  { slug: "pla", label: "PLA" },
  { slug: "petg", label: "PETG" },
  { slug: "tpu", label: "TPU" },
  { slug: "impressoras", label: "Impressoras" },
  { slug: "pecas", label: "Peças" },
  { slug: "kits", label: "Kits" },
];

export function CategoryStrip() {
  return (
    <section
      className={styles.categoryStrip}
      /* Nomeia o bloco para o editor de layout do painel; ver PontePreviaEditor. */
      data-bloco="categories"
    >
      <div className="container">
        <div className={styles.categoryStripTrack}>
          {stripTiles.map((tile) => (
            <a className={styles.categoryStripItem} href="/produtos" key={tile.slug}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                /* O rótulo logo abaixo já nomeia o tile; repetir no alt faria o
                   leitor de tela anunciar a categoria duas vezes seguidas. */
                alt=""
                aria-hidden="true"
                loading="lazy"
                /* Renderiza a ~196 CSS no desktop e 118 no celular. O master tem
                   390 px: 118 @3x sobra, e 196 @2x fica 2 px curto — meio por
                   cento, que não aparece. Subir a arte só por isso não paga. */
                sizes="(max-width: 767px) 118px, 195px"
                src={`/banners/category-strip/${tile.slug}-256.webp`}
                srcSet={`/banners/category-strip/${tile.slug}-256.webp 256w, /banners/category-strip/${tile.slug}-390.webp 390w`}
              />
              <span className={styles.categoryStripLabel}>{tile.label}</span>
            </a>
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

export async function PrintersRail() {
  const products = await listarProdutos();

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
