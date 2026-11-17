import Image from "next/image";
import { ArrowRight, LockKeyhole, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: Trophy, title: "Miss France 2027", subtitle: "Une édition à pronostiquer" },
  { icon: Users, title: "Gratuit & ouvert", subtitle: "Jouez avec vos proches" },
  { icon: LockKeyhole, title: "Choix confidentiels", subtitle: "Jusqu'à la clôture" }
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-gold/15">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_70%_45%,rgba(191,145,67,0.19),transparent_48%),linear-gradient(115deg,#0a0a09_5%,#17130e_55%,#090909_100%)]" />
      <div className="absolute -right-32 top-10 -z-10 h-[520px] w-[520px] rounded-full border border-gold/10 blur-[1px]" />
      <div className="absolute -right-16 top-24 -z-10 h-[380px] w-[380px] rounded-full border border-gold/10" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:gap-10 sm:px-5 sm:py-12 lg:min-h-[610px] lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-[auto_1fr] lg:px-8 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-champagne sm:mb-7 sm:px-4 sm:text-[11px] sm:tracking-[0.2em]">
            <Sparkles size={14} className="text-gold" />
            <span>L&apos;élection se joue aussi ici</span>
          </div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold sm:mb-4 sm:text-xs sm:tracking-[0.3em]">Édition 2027</p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.96] tracking-[-0.035em] text-champagne">
            Miss France.<br />
            <span className="gold-text italic">Vos pronostics.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/65 sm:mt-7 sm:text-lg sm:leading-8">
            Le jeu de pronostics autour de Miss France. Composez votre Top 12,
            défiez vos amis et découvrez qui connaît vraiment l&apos;élection.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row lg:flex-col xl:flex-row">
            <Button href="/pronostics" className="group w-full sm:w-auto lg:w-full xl:w-auto">
              Commencer à pronostiquer
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="/candidates" variant="secondary" className="w-full sm:w-auto lg:w-full xl:w-auto">Découvrir les candidates</Button>
          </div>

        </div>

        <div className="relative mx-auto w-full max-w-[520px] px-1 sm:px-0 lg:row-span-2">
          <div className="absolute left-1/2 top-[10%] h-[65%] w-[75%] -translate-x-1/2 rounded-full bg-gold/10 blur-[90px]" />
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[48%] rounded-b-[180px] border border-gold/35 bg-gradient-to-b from-[#6e5230] via-[#251d13] to-[#0b0b0b] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <Image
              src="/images/hero-pageant.svg"
              alt="Illustration éditoriale d'une couronne et d'une silhouette de candidate"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 1024px) 90vw, 42vw"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-3 sm:gap-5 sm:pt-7 lg:col-start-1 lg:row-start-2 lg:mt-0">
          {highlights.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex min-w-0 items-start gap-2 last:col-span-2 sm:gap-3 sm:last:col-span-1">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold sm:h-5 sm:w-5" strokeWidth={1.6} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ivory sm:text-sm">{title}</p>
                <p className="mt-1 text-[11px] leading-4 text-white/40 sm:text-xs sm:leading-5">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
