import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Heart, MapPin, Ruler, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { candidates2027 } from "@/data/candidates-2027";
import { getCandidate2027 } from "@/features/candidates/repository";

type CandidatePageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

function getStaticCandidate(slug: string) {
  return candidates2027.find((candidate) => candidate.slug === slug);
}

export function generateStaticParams() {
  return candidates2027.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CandidatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const candidate = getStaticCandidate(slug);
  return candidate
    ? { title: `${candidate.name} · Miss ${candidate.region} 2027`, description: `Découvrez le profil de ${candidate.name}, représentante de ${candidate.region} pour Miss France 2027.` }
    : { title: "Candidate introuvable" };
}

export default async function CandidateProfilePage({ params }: CandidatePageProps) {
  const { slug } = await params;
  const candidate = await getCandidate2027(slug);
  if (!candidate) notFound();

  return (
    <main className="section-wrap pb-16 sm:pb-24">
      <Link href="/candidates" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
        <ArrowLeft size={16} /> Retour aux candidates
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-gold/20 bg-[#211a12] lg:max-w-none">
          <Image src={candidate.imageSrc} alt={`Portrait de ${candidate.name}, Miss ${candidate.region} 2027`} fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
          <span className="absolute left-5 top-5 rounded-full border border-gold/25 bg-black/35 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-champagne backdrop-blur">N° {String(candidate.number).padStart(2, "0")}</span>
          <p className="absolute inset-x-4 bottom-4 text-center font-display text-2xl text-white drop-shadow sm:text-3xl">Miss {candidate.region}</p>
        </div>

        <section className="flex flex-col rounded-3xl border border-white/10 bg-[#171614] p-6 sm:p-9">
          <p className="section-eyebrow">Miss {candidate.region} · Édition 2027</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-champagne sm:text-5xl">{candidate.name}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">Candidate à l’élection Miss France 2027, elle représente la région {candidate.region}.</p>

          <dl className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            <div className="grid gap-5 py-5 min-[480px]:grid-cols-2">
              {candidate.age && <div className="flex gap-4"><CalendarDays size={18} className="mt-0.5 shrink-0 text-gold" /><div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Âge</dt><dd className="mt-1 text-sm text-ivory">{candidate.age} ans</dd></div></div>}
              {candidate.heightCm && <div className="flex gap-4"><Ruler size={18} className="mt-0.5 shrink-0 text-gold" /><div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Taille</dt><dd className="mt-1 text-sm text-ivory">{(candidate.heightCm / 100).toFixed(2).replace(".", ",")} m</dd></div></div>}
            </div>
            {candidate.hometown && (
              <div className="flex gap-4 py-5">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold" />
                <div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Ville / origine</dt><dd className="mt-1 text-sm text-ivory">{candidate.hometown}</dd></div>
              </div>
            )}
            {candidate.electedOn && <div className="flex gap-4 py-5"><CalendarDays size={18} className="mt-0.5 shrink-0 text-gold" /><div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Élue Miss {candidate.region}</dt><dd className="mt-1 text-sm text-ivory">Le {candidate.electedOn}{candidate.electedAt ? ` · ${candidate.electedAt}` : ""}</dd></div></div>}
            {candidate.education && <div className="flex gap-4 py-5"><UserRound size={18} className="mt-0.5 shrink-0 text-gold" /><div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Études</dt><dd className="mt-1 text-sm leading-6 text-ivory">{candidate.education}</dd></div></div>}
            {candidate.occupation && <div className="flex gap-4 py-5"><BriefcaseBusiness size={18} className="mt-0.5 shrink-0 text-gold" /><div><dt className="text-xs uppercase tracking-[0.14em] text-white/40">Activité</dt><dd className="mt-1 text-sm leading-6 text-ivory">{candidate.occupation}</dd></div></div>}
          </dl>

          {(candidate.passions?.length || candidate.commitments?.length || candidate.biography) && (
            <div className="mt-7 space-y-6">
              {candidate.passions && candidate.passions.length > 0 && <div className="flex gap-4"><Heart size={18} className="mt-0.5 shrink-0 text-gold" /><div><h2 className="text-xs uppercase tracking-[0.14em] text-white/40">Passions</h2><p className="mt-2 text-sm leading-6 text-ivory">{candidate.passions.join(" · ")}</p></div></div>}
              {candidate.commitments && candidate.commitments.length > 0 && <div className="flex gap-4"><Heart size={18} className="mt-0.5 shrink-0 text-gold" /><div><h2 className="text-xs uppercase tracking-[0.14em] text-white/40">Engagements</h2><ul className="mt-2 space-y-1 text-sm leading-6 text-ivory">{candidate.commitments.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
              {candidate.biography && <div className="flex gap-4"><UserRound size={18} className="mt-0.5 shrink-0 text-gold" /><div><h2 className="text-xs uppercase tracking-[0.14em] text-white/40">Parcours</h2><p className="mt-2 text-sm leading-6 text-ivory">{candidate.biography}</p></div></div>}
            </div>
          )}

          <div className="mt-auto pt-7">
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={candidate.officialSourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-gold/25 px-4 text-xs font-medium text-champagne transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Liste officielle · TF1 Pro</a>
              <a href={candidate.profileSourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-4 text-xs font-medium text-white/65 transition hover:border-white/25 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Portrait & parcours · Le Parisien</a>
              {candidate.instagramUrl && <a href={candidate.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-4 text-xs font-medium text-white/65 transition hover:border-white/25 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Instagram officiel</a>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
