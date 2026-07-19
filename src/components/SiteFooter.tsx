import {
  CardIcon,
  CheckIcon,
  InstagramIcon,
  PhoneIcon,
  PixIcon,
  ShieldIcon,
  WhatsAppIcon,
} from "./icons";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

const institutional = [
  "Quem somos",
  "Política de privacidade",
  "Trocas e devoluções",
  "Prazos e entregas",
  "Termos de uso",
];

const categories = ["PLA", "PETG"];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <Reveal>
            <h2>Entre para o clube Triomax</h2>
            <p>Lançamentos, ofertas exclusivas e dicas de impressão direto no seu e-mail.</p>
          </Reveal>
          <Reveal delay={120}>
            <form aria-label="Assinar newsletter" className={styles.newsletterForm}>
              <label htmlFor="newsletter-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
                Seu e-mail
              </label>
              <input
                autoComplete="email"
                id="newsletter-email"
                inputMode="email"
                name="email"
                placeholder="Digite seu melhor e-mail"
                type="email"
              />
              <button className={styles.buttonGold} type="submit">
                Quero receber
              </button>
            </form>
          </Reveal>
        </div>
      </div>

      <div className={`container ${styles.footerColumns}`}>
        <div className={styles.footerBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Triomax" src="/brand/triomax-black.svg" />
          <p>
            Filamentos de alta performance para makers, engenheiros e estúdios criativos de todo o
            Brasil.
          </p>
          <div className={styles.footerSocial}>
            <a aria-label="Instagram da Triomax" href="https://instagram.com" rel="noreferrer" target="_blank">
              <InstagramIcon />
            </a>
            <a aria-label="WhatsApp da Triomax" href="https://wa.me/555132768583" rel="noreferrer" target="_blank">
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <nav aria-label="Institucional" className={styles.footerCol}>
          <h3>Institucional</h3>
          <ul>
            {institutional.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Categorias" className={styles.footerCol}>
          <h3>Categorias</h3>
          <ul>
            {categories.map((item) => (
              <li key={item}>
                <a href="/produtos">{item}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.footerCol}>
          <h3>Atendimento</h3>
          <ul className={styles.footerContact}>
            <li>
              <WhatsAppIcon />
              <span>(51) 3276-8583</span>
            </li>
            <li>
              <PhoneIcon />
              <span>Seg. a sex., das 9h às 18h</span>
            </li>
            <li>
              <PixIcon />
              <span>Pix, cartão e boleto</span>
            </li>
            <li>
              <ShieldIcon />
              <span>Loja 100% segura</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={`container ${styles.footerBottomInner}`}>
          <p>© {new Date().getFullYear()} Triomax. Todos os direitos reservados. Preview visual — dados ilustrativos.</p>
          <div className={styles.footerSeals}>
            <span>
              <ShieldIcon />
              Ambiente seguro
            </span>
            <span>
              <CardIcon />
              12x sem juros
            </span>
            <span>
              <CheckIcon />
              Envio em 24h
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
