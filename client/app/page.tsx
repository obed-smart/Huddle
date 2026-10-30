import { SiteHeader } from "@/features/marketing/site-header";
import { Hero } from "@/features/marketing/hero";
import { FeatureSection } from "@/features/marketing/feature-section";
import { CtaSection } from "@/features/marketing/cta-section";
import { SiteFooter } from "@/features/marketing/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <FeatureSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
