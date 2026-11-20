"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

const places = ["Miss France", "Première dauphine", "Deuxième dauphine", "Troisième dauphine", "Quatrième dauphine"];

export function ScoringRulesDialog({ rules }: { rules: { rank: number; points: number }[] }) {
  const [open, setOpen] = useState(false);
  const rankedRules = [...rules].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/25 px-4 text-sm text-champagne transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
        <Info size={16} /> Barème des points
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="scoring-dialog-title" className="max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#171614] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="section-eyebrow">Miss France 2027</p><h2 id="scoring-dialog-title" className="mt-2 font-display text-3xl text-champagne">Barème des points</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            {rankedRules.length ? (
              <ol className="mt-6 divide-y divide-white/[0.07]">
                {rankedRules.map(({ rank, points }) => (
                  <li key={rank} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-white/75">{places[rank - 1] ?? `Candidate classée ${rank}${rank === 1 ? "re" : "e"} du Top 12`}</span>
                    <span className="shrink-0 font-semibold text-gold">{points} pt{points > 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">Le barème de cette édition n’est pas encore configuré.</p>}
            <p className="mt-4 text-xs leading-5 text-white/40">Les points du Top 12 sont attribués dès qu’une candidate annoncée figure dans ta sélection. Les cinq premières places rapportent les points du rang exact.</p>
          </section>
        </div>
      )}
    </>
  );
}
