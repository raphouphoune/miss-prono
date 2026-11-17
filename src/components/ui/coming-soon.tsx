import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-20">
      <div className="max-w-xl text-center">
        <Crown className="mx-auto h-10 w-10 text-gold" strokeWidth={1.4} />
        <p className="section-eyebrow mt-6">Miss Prono · Édition 2027</p>
        <h1 className="section-title mt-3">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-white/50">{description}</p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-champagne">
          <ArrowLeft size={16} /> Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
