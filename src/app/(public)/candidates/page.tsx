import { Sparkles } from "lucide-react";
import { CandidateGallery } from "@/components/candidates/candidate-gallery";
import { getCandidates2027 } from "@/features/candidates/repository";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await getCandidates2027();
  return (
    <main className="section-wrap">
      <header className="relative overflow-hidden rounded-3xl border border-gold/20 bg-[radial-gradient(ellipse_at_80%_20%,rgba(200,164,93,0.16),transparent_42%),linear-gradient(120deg,#1a1711,#11100e)] px-6 py-10 sm:px-10 sm:py-14">
        <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-gold/10" />
        <div aria-hidden="true" className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-gold/[0.08]" />
        <div className="relative max-w-3xl">
          <p className="section-eyebrow inline-flex items-center gap-2"><Sparkles size={13} /> Édition 2027</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.025em] text-champagne sm:text-5xl lg:text-6xl">
            Les visages <span className="gold-text italic">de l&apos;édition.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            Parcourez les profils, explorez les régions et préparez vos favorites pour l&apos;élection.
          </p>
        </div>
      </header>

      <CandidateGallery candidates={candidates} />
    </main>
  );
}
