import {
  BenefitsBar,
  CategoryShowcase,
  FeaturedProducts,
  InstagramSection,
  PrintersRail,
  PromoBanner,
} from "@/components/HomeSections";
import { HeroSection } from "@/components/HeroSection";
import { AnnouncementMarquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <AnnouncementMarquee />
      <main>
        <HeroSection />
        <BenefitsBar />
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
