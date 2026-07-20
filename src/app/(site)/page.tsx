import { BenefitsBar } from "@/components/site/BenefitsBar";
import {
  CategoryShowcase,
  CategoryStrip,
  FeaturedProducts,
  InstagramSection,
  PrintersRail,
  PromoBanner,
} from "@/components/site/HomeSections";
import { HeroSection } from "@/components/site/HeroSection";
import { AnnouncementMarquee } from "@/components/site/Marquee";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main>
        <HeroSection />
        <BenefitsBar />
        <CategoryStrip />
        <FeaturedProducts />
        <CategoryShowcase />
        <PromoBanner />
        <PrintersRail />
        <InstagramSection />
      </main>
      <SiteFooter />
    </>
  );
}
