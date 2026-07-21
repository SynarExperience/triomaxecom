import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  PhoneIcon,
  StoreIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "./icons";
import { PaymentBrands } from "./PaymentBrands";
import { Reveal } from "./Reveal";
import styles from "./store.module.css";

const categories = ["PLA", "PETG", "Impressoras 3D", "Acessórios"];

const institutionalA: { label: string; href: string }[] = [
  { label: "Quem somos", href: "/sobre" },
  { label: "Perguntas frequentes", href: "#" },
  { label: "Trocas e devoluções", href: "#" },
  { label: "Política de privacidade", href: "#" },
];

const institutionalB: { label: string; href: string }[] = [
  { label: "Prazos e entregas", href: "#" },
  { label: "Como comprar", href: "#" },
  { label: "Termos de uso", href: "#" },
  { label: "Seja um revendedor", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <Reveal className={styles.newsletterBrand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Triomax" src="/brand/triomax-black.svg" />
            <div className={styles.footerSocial}>
              <a aria-label="Instagram da Triomax" href="https://instagram.com/triomaxx_" rel="noreferrer" target="_blank">
                <InstagramIcon />
              </a>
              <a aria-label="Facebook da Triomax" href="#" rel="noreferrer" target="_blank">
                <FacebookIcon />
              </a>
              <a aria-label="YouTube da Triomax" href="#" rel="noreferrer" target="_blank">
                <YouTubeIcon />
              </a>
              <a aria-label="LinkedIn da Triomax" href="#" rel="noreferrer" target="_blank">
                <LinkedInIcon />
              </a>
            </div>
          </Reveal>

          <Reveal className={styles.newsletterForm} delay={120}>
            <h2>Receba nossas novidades por e-mail e WhatsApp</h2>
            <form aria-label="Assinar newsletter">
              <label className={styles.srOnly} htmlFor="nl-nome">
                Nome completo
              </label>
              <input autoComplete="name" id="nl-nome" name="nome" placeholder="Nome completo" type="text" />
              <label className={styles.srOnly} htmlFor="nl-fone">
                Fone/WhatsApp
              </label>
              <input autoComplete="tel" id="nl-fone" inputMode="tel" name="fone" placeholder="Fone/WhatsApp" type="tel" />
              <label className={styles.srOnly} htmlFor="nl-email">
                E-mail
              </label>
              <input autoComplete="email" id="nl-email" inputMode="email" name="email" placeholder="E-mail" type="email" />
              <button className={styles.buttonGold} type="submit">
                OK
              </button>
            </form>
          </Reveal>
        </div>
      </div>

      <div className={`container ${styles.footerColumns}`}>
        <div className={styles.footerBrand}>
          <p>
            Filamentos de alta performance para makers, engenheiros e estúdios criativos de todo o
            Brasil. Curadoria própria, controle de qualidade e um atendimento que entende de
            impressão 3D de verdade.
          </p>
        </div>

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

        <nav aria-label="Institucional" className={styles.footerCol}>
          <h3>Institucional</h3>
          <div className={styles.footerColSplit}>
            <ul>
              {institutionalA.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
            <ul>
              {institutionalB.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className={styles.footerCol}>
          <h3>Entre em contato</h3>
          <ul className={styles.footerContact}>
            <li>
              <WhatsAppIcon />
              <span>(51) 3276-8583</span>
            </li>
            <li>
              <StoreIcon />
              <span>contato@triomax.com.br</span>
            </li>
            <li>
              <PhoneIcon />
              <span>Seg. a sex., das 9h às 18h</span>
            </li>
          </ul>

          <div className={styles.footerSecurity}>
            <h3>Segurança</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Site seguro com SSL 256 bits e Google Safe Browsing"
              className={styles.secSeal}
              height={62}
              src="/brand/selo-seguranca.png"
              width={240}
            />
          </div>
        </div>
      </div>

      <div className={`container ${styles.footerPayments}`}>
        <div>
          <h3>Formas de pagamento</h3>
          <PaymentBrands />
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={`container ${styles.footerBottomInner}`}>
          <p>© {new Date().getFullYear()} Triomax. Todos os direitos reservados.</p>
          <span className={styles.madeWith}>
            criado por <strong>Synar Experience</strong>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Synar Experience" height={42} src="/brand/synar.svg" width={63} />
          </span>
        </div>
      </div>
    </footer>
  );
}
