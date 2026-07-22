import { BenefitsBar } from "@/components/site/BenefitsBar";
import {
  CategoryStrip,
  FeaturedProducts,
  FeatureGrid,
  InstagramSection,
  PrintersRail,
} from "@/components/site/HomeSections";
import { HeroSection } from "@/components/site/HeroSection";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listarBanners } from "@/lib/conteudo";

export default async function Home() {
  /* O hero é client (carrossel, arrasto, vídeo), então quem lê o banco é esta
     página. Banner sem `nome_base` não tem como virar srcset — ficaria um slide
     de imagem quebrada, melhor não entrar no carrossel. */
  const banners = (await listarBanners("hero"))
    .filter((banner) => banner.nomeBase)
    .map((banner) => ({
      name: banner.nomeBase,
      alt: banner.alt,
      label: banner.rotulo,
      link: banner.link,
    }));

  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main>
        <HeroSection banners={banners} />
        <BenefitsBar />
        <CategoryStrip />
        <FeaturedProducts />
        <FeatureGrid />
        <PrintersRail />
        <InstagramSection />
      </main>
      <SiteFooter />
    </>
  );
}
