import { ArrowRight, Crown, Medal, TrendingUp, Minus, TrendingDown } from "lucide-react";
import Link from "next/link";
import { demoLeaderboard } from "@/data/demo";

const trendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  same: Minus
};

export function LeaderboardPreview() {
  return (
    <section className="section-wrap">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow">La compétition</p>
          <h2 className="section-title">Le classement <span className="gold-text italic">des pronostiqueurs.</span></h2>
          <p className="mt-3 text-sm text-white/45">Aperçu fictif — les scores seront calculés après l&apos;élection.</p>
        </div>
        <Link href="/classement" className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-champagne">
          Voir le classement <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#141311]">
        <div className="grid grid-cols-[36px_minmax(0,1fr)_68px] gap-2 border-b border-white/[0.08] px-3.5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35 sm:grid-cols-[70px_minmax(0,1fr)_110px_90px] sm:gap-3 sm:px-5 sm:py-4 sm:text-[10px] sm:tracking-[0.18em]">
          <span>Rang</span><span>Joueur</span><span className="hidden sm:block">Évolution</span><span className="text-right">Points</span>
        </div>
        {demoLeaderboard.map((entry) => {
          const Trend = trendIcon[entry.trend];
          return (
            <div key={entry.rank} className="grid grid-cols-[36px_minmax(0,1fr)_68px] items-center gap-2 border-b border-white/[0.06] px-3.5 py-3 last:border-0 sm:grid-cols-[70px_minmax(0,1fr)_110px_90px] sm:gap-3 sm:px-5 sm:py-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${entry.rank === 1 ? "bg-gold text-black" : "bg-white/[0.07] text-white/70"}`}>
                {entry.rank === 1 ? <Crown size={15} /> : entry.rank}
              </div>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gradient-to-br from-[#73562f] to-[#292016] font-display text-lg text-champagne sm:h-9 sm:w-9">
                  {entry.initials}
                </div>
                <span className="min-w-0 truncate text-xs font-medium text-ivory sm:text-sm">{entry.username}</span>
                {entry.rank === 1 && <Medal size={14} className="shrink-0 text-gold" />}
              </div>
              <div className="hidden sm:block">
                <span className={`inline-flex items-center gap-1 text-xs ${entry.trend === "up" ? "text-emerald-400" : entry.trend === "down" ? "text-rose-400" : "text-white/35"}`}>
                  <Trend size={14} /> {entry.trend === "up" ? "En hausse" : entry.trend === "down" ? "En baisse" : "Stable"}
                </span>
              </div>
              <span className="text-right font-display text-lg text-champagne sm:text-xl">{entry.points} <span className="font-sans text-[10px] text-white/35">pts</span></span>
            </div>
          );
        })}
        <div className="border-t border-gold/15 bg-gold/[0.04] px-5 py-4 text-center text-xs text-white/40">
          Les données affichées sont fictives et servent uniquement à présenter l&apos;interface.
        </div>
      </div>
    </section>
  );
}
