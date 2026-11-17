import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";

export default function NotFound() {
  return (
    <main className="section-wrap grid min-h-[70vh] place-items-center text-center">
      <div className="max-w-lg">
        <Crown className="mx-auto text-gold" size={32} strokeWidth={1.5} />
        <p className="mt-6 section-eyebrow">Erreur 404</p>
        <h1 className="section-title">Cette page n’existe pas.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Le lien a peut-être changé ou la page a été retirée.</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-black transition hover:brightness-110"><ArrowLeft size={16} /> Retour à l’accueil</Link>
      </div>
    </main>
  );
}
