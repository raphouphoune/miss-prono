"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="section-wrap grid min-h-[70vh] place-items-center text-center">
      <div className="max-w-lg">
        <p className="section-eyebrow">Une erreur est survenue</p>
        <h1 className="section-title">La page n’a pas pu se charger.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Réessaie. Si le problème continue, reviens à l’accueil et réouvre la page.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => reset()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-black"><RefreshCw size={15} /> Réessayer</button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium text-ivory">Retour à l’accueil</Link>
        </div>
      </div>
    </main>
  );
}
