import { categoryCards, featuredProducts, products } from "@/data/catalog";
import {
  ArrowRightIcon,
  CardIcon,
  FlameIcon,
  InstagramIcon,
  PixIcon,
  ShieldIcon,
  TruckIcon,
} from "./icons";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

const benefits = [
  {
    icon: <TruckIcon />,
    title: "Frete grátis",
    text: "Nas compras acima de R$ 299 para todo o Brasil",
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
  },
  {
    icon: <ShieldIcon />,
    title: "Compra protegida",
    text: "Site seguro e envio em até 24h úteis",
  },
];

export function BenefitsBar() {
  return (
    <section aria-label="Vantagens da loja" className={styles.benefits}>
      <div className={`container ${styles.benefitsGrid}`}>
        {benefits.map((benefit, index) => (
          <Reveal className={styles.benefit} delay={index * 70} key={benefit.title}>
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
                    <img alt="" aria-hidden="true" className="productPhoto" loading="lazy" src={category.image} />
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

export function PromoBanner() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Reveal>
          <div className={styles.promo}>
            <div className={styles.promoInner}>
              <div>
                <p className={styles.promoTag}>
                  <FlameIcon />
                  Semana Triomax
                </p>
                <h2>Leve 3 carretéis, pague 2</h2>
                <p>
                  Combine as cores que quiser em qualquer linha. O desconto entra sozinho no
                  carrinho — válido enquanto durar o estoque.
                </p>
                <div className={styles.promoActions}>
                  <a className={styles.buttonGold} href="/produtos">
                    Montar meu kit
                    <ArrowRightIcon />
                  </a>
                  <a className={styles.buttonGhost} href="/produtos">
                    Ver catálogo
                  </a>
                </div>
              </div>
              <div className={styles.promoFigure}>
                <span className={styles.promoGlow} aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Carretel de filamento Triomax preto" className="productPhoto" loading="lazy" src="/products/filamento-preto.webp" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
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

const instagramTiles = [
  { image: "/products/filamento-azul.webp", label: "PLA Premium azul" },
  { image: "/products/filamento-vermelho.webp", label: "Vaso impresso em vermelho" },
  { image: "/products/filamento-preto.webp", label: "PLA Matte preto" },
  { image: "/products/filamento-amarelo.webp", label: "TPU Flex amarelo" },
  { image: "/products/filamento-verde.webp", label: "PETG verde" },
  { image: "/products/filamento-branco.webp", label: "PLA Engenharia branco" },
];

export function InstagramSection() {
  return (
    <section className={styles.section} id="instagram">
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>@triomax3d</p>
            <h2 className={styles.sectionTitle}>No Instagram</h2>
          </div>
          <a
            className={styles.sectionLink}
            href="https://instagram.com"
            rel="noreferrer"
            target="_blank"
          >
            Seguir perfil
            <ArrowRightIcon />
          </a>
        </Reveal>
        <div className={styles.instaGrid}>
          {instagramTiles.map((tile, index) => (
            <Reveal delay={index * 60} key={tile.label}>
              <a
                aria-label={`${tile.label} — abrir Instagram`}
                className={styles.instaTile}
                href="https://instagram.com"
                rel="noreferrer"
                target="_blank"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={tile.label} className="productPhoto" loading="lazy" src={tile.image} />
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
