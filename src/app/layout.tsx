import type { Metadata } from "next";
import { Jost, Poppins, Urbanist } from "next/font/google";
import localFont from "next/font/local";

/* Peso único (400). Títulos em pesos maiores usam `font-synthesis: none`
   para não cair em falso-negrito. */
const neulis = localFont({
  src: "../fonts/NeulisNeue-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-neulis",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const SITE_TITLE = "Triomax | Filamentos e Impressoras 3D";
const SITE_DESCRIPTION =
  "Triomax — filamentos de alta performance e impressoras 3D. Experiência premium em impressão 3D.";

export const metadata: Metadata = {
  metadataBase: new URL("https://triomaxoficial.com.br"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "/brand/triomax-black.svg" },
  /*
   * Preview de link no WhatsApp/redes: o WhatsApp não renderiza SVG e ignora
   * caminho relativo, então serve um PNG da logo em fundo branco por URL
   * absoluta (montada a partir do `metadataBase`). Sem estas tags o link
   * aparecia sem imagem nenhuma.
   */
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Triomax",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "pt_BR",
    images: [
      {
        url: "/og-triomax.png",
        width: 1200,
        height: 630,
        alt: "Triomax",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-triomax.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} ${urbanist.variable} ${neulis.variable} ${jost.variable}`}>
        {children}
      </body>
    </html>
  );
}
