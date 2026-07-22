import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import pageStyles from "@/components/site/pages.module.css";
import { buscarPagina, listarPaginas } from "@/lib/conteudo";

/*
 * Páginas institucionais escritas no painel (trocas, privacidade, FAQ…). O
 * layout é o mesmo de /sobre, só que o texto vem do banco: publicar uma página
 * nova não pede deploy, basta marcá-la como publicada.
 */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const paginas = await listarPaginas();
  return paginas.map((pagina) => ({ slug: pagina.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await buscarPagina(slug);
  if (!pagina) return { title: "Página não encontrada | Triomax" };
  return {
    title: `${pagina.titulo} | Triomax`,
    description: pagina.resumo,
  };
}

export default async function ConteudoPage({ params }: PageProps) {
  const { slug } = await params;
  const pagina = await buscarPagina(slug);
  if (!pagina) notFound();

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
            <li aria-current="page">{pagina.titulo}</li>
          </ol>

          <Reveal className={pageStyles.aboutHeader}>
            <h1>{pagina.titulo}</h1>
          </Reveal>

          <Reveal>
            <article className={pageStyles.contentBody}>
              {pagina.resumo ? <p className={pageStyles.contentLead}>{pagina.resumo}</p> : null}
              {pagina.conteudo.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </article>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
