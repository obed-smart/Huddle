import { HashRedirect } from "@/features/auth/hash-redirect";
import { SiteHeader } from "@/features/marketing/site-header";
import { Hero } from "@/features/marketing/hero";
import { TrustStrip } from "@/features/marketing/trust-strip";
import { FeatureSection } from "@/features/marketing/feature-section";
import { ShowcaseSection } from "@/features/marketing/showcase-section";
import { CtaSection } from "@/features/marketing/cta-section";
import { SiteFooter } from "@/features/marketing/site-footer";

export default function Home() {
  return (
    <>
      <HashRedirect />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <TrustStrip />
        <FeatureSection />
        <ShowcaseSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
