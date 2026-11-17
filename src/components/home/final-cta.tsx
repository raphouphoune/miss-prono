import { ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-4 pb-16 pt-4 sm:px-5 sm:pb-24 sm:pt-8 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gold/25 bg-[radial-gradient(ellipse_at_80%_50%,rgba(200,164,93,0.18),transparent_45%),linear-gradient(110deg,#1a1711,#11100e)] px-5 py-10 text-center sm:rounded-3xl sm:px-14 sm:py-14">
        <Crown className="mx-auto h-8 w-8 text-gold" strokeWidth={1.4} />
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Miss France 2027</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl leading-tight text-champagne sm:text-4xl lg:text-5xl">
          Votre intuition mérite sa couronne.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/50">
          Préparez vos pronostics et retrouvez vos amis pour vivre l&apos;élection autrement.
        </p>
        <Button href="/inscription" className="mt-8">
          Créer mon compte <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
