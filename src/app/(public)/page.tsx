import { Hero } from "@/components/home/hero";
import { FeatureGrid } from "@/components/home/feature-grid";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";
import { FinalCta } from "@/components/home/final-cta";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeatureGrid />
      <LeaderboardPreview />
      <FinalCta />
    </main>
  );
}
