import { Crown, LockKeyhole, Users, ArrowUpRight } from "lucide-react";
import { features } from "@/data/demo";

const icons = { crown: Crown, users: Users, lock: LockKeyhole };

export function FeatureGrid() {
  return (
    <section className="section-wrap">
      <div className="mb-10 max-w-2xl">
        <p className="section-eyebrow">Le concept</p>
        <h2 className="section-title">L&apos;élection, <span className="gold-text italic">à votre façon.</span></h2>
        <p className="mt-4 text-sm leading-7 text-white/50">
          Faites vos choix, partagez le suspense avec vos proches et suivez votre score
          lorsque les résultats officiels seront dévoilés.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = icons[feature.icon];
          return (
            <article key={feature.title} className="group rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-7 transition duration-300 hover:-translate-y-1 hover:border-gold/35">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <p className="mt-8 text-[10px] font-semibold tracking-[0.22em] text-gold">{feature.eyebrow}</p>
              <h3 className="mt-2 font-display text-2xl text-champagne">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{feature.description}</p>
              <div className="mt-7 flex items-center justify-between text-xs text-white/35">
                <span>0{index + 1} / 03</span>
                <ArrowUpRight size={16} className="text-gold/70 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
