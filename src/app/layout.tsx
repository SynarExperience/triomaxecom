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

export const metadata: Metadata = {
  title: "Triomax | Filamentos e Impressoras 3D",
  description:
    "Triomax — filamentos de alta performance e impressoras 3D. Experiência premium em impressão 3D.",
  icons: { icon: "/brand/triomax-black.svg" },
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
