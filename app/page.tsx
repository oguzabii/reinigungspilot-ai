import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { ModulesOverview } from "@/components/landing/ModulesOverview";
import { PackagesSection } from "@/components/landing/PackagesSection";
import { AddOnsOverview } from "@/components/landing/AddOnsOverview";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { CustomerSuccessSection } from "@/components/landing/CustomerSuccessSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <ProblemSection />
        <SolutionSection />
        <ModulesOverview />
        <PackagesSection />
        <AddOnsOverview />
        <ComparisonSection />
        <CustomerSuccessSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
