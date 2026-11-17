import Link from "next/link";
import { Crown } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0b0b0b]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <span className="font-display text-xl tracking-[0.1em] text-champagne">MISS PRONO</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
            Le jeu de pronostics imaginé pour vivre l&apos;élection Miss France autrement.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
          <Link href="/mentions-legales" className="hover:text-gold">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-gold">Confidentialité</Link>
          <Link href="/conditions-utilisation" className="hover:text-gold">Conditions d’utilisation</Link>
          <Link href="/contact" className="hover:text-gold">Contact</Link>
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-5 py-4 text-center text-[11px] text-white/30">
        © {new Date().getFullYear()} Miss Prono — Projet indépendant, non affilié à l&apos;organisation Miss France.
      </div>
    </footer>
  );
}
