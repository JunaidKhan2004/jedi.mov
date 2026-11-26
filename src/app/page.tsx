import { HeroSection } from "@/components/HeroSection";
import { BentoToolsGrid } from "@/components/BentoToolsGrid";
import { HomeSections } from "@/components/HomeSections";
import { AdBanner } from "@/components/AdBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Primary Leaderboard Ad below Hero */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdBanner slot="home-top-leaderboard" format="leaderboard" />
      </div>

      <BentoToolsGrid />

      {/* Mid-page Responsive Ad Banner */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdBanner slot="home-mid-banner" format="horizontal" />
      </div>

      <HomeSections />
    </>
  );
}
