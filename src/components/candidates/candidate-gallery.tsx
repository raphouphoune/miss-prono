"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, MapPin, Search, X } from "lucide-react";
import type { Candidate } from "@/types";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link href={`/candidates/${candidate.slug}`} aria-label={`Découvrir le profil de ${candidate.name}`} className="group block overflow-hidden rounded-2xl border border-white/[0.09] bg-[#171614] transition duration-300 hover:-translate-y-1 hover:border-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#211a12]">
        <Image src={candidate.imageSrc} alt={`Portrait de ${candidate.name}, Miss ${candidate.region} 2027`} fill sizes="(max-width: 479px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw" className="object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#11100e] via-transparent to-black/20" />

        <span className="absolute left-4 top-4 rounded-full border border-gold/25 bg-black/35 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-champagne backdrop-blur">
          N° {String(candidate.number).padStart(2, "0")}
        </span>
        <span className="absolute right-4 top-4 inline-flex max-w-[55%] items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-medium text-white/75 backdrop-blur">
          <MapPin size={11} className="shrink-0 text-gold" />
          <span className="truncate">{candidate.region}</span>
        </span>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-16 text-center">
          <Crown size={16} className="mx-auto mb-2 text-gold/80" strokeWidth={1.4} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Miss {candidate.region}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl text-champagne sm:text-2xl">{candidate.name}</h2>
          <p className="mt-1 truncate text-xs text-white/45">{candidate.age ? `${candidate.age} ans · ` : ""}{candidate.occupation ?? candidate.region}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-gold/80 transition group-hover:translate-x-1">Voir →</span>
      </div>
    </Link>
  );
}

export function CandidateGallery({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");

  const regions = useMemo(
    () => [...new Set(candidates.map((candidate) => candidate.region))].sort((a, b) => a.localeCompare(b, "fr")),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const search = normalize(query.trim());

    return candidates.filter((candidate) => {
      const matchesRegion = region === "all" || candidate.region === region;
      const searchableDetails = [candidate.name, candidate.region, candidate.hometown, candidate.occupation, candidate.education, candidate.biography, ...(candidate.passions ?? []), ...(candidate.commitments ?? [])].filter(Boolean).join(" ");
      const matchesQuery = !search || normalize(searchableDetails).includes(search);
      return matchesRegion && matchesQuery;
    });
  }, [candidates, query, region]);

  function clearFilters() {
    setQuery("");
    setRegion("all");
  }

  return (
    <section aria-labelledby="candidate-list-title" className="mt-10 sm:mt-12">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">La galerie</p>
          <h2 id="candidate-list-title" className="mt-2 font-display text-3xl text-champagne sm:text-4xl">Toutes les candidates</h2>
          <p className="mt-2 text-sm text-white/45" aria-live="polite">
            {filteredCandidates.length} profil{filteredCandidates.length === 1 ? "" : "s"} affiché{filteredCandidates.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid gap-3 sm:w-full sm:max-w-xl sm:grid-cols-[1fr_220px]">
          <label className="relative block">
            <span className="sr-only">Rechercher par nom ou région</span>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou région"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-ivory outline-none transition placeholder:text-white/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/15"
            />
          </label>

          <label>
            <span className="sr-only">Filtrer par région</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#171614] px-4 text-sm text-ivory outline-none transition focus:border-gold/55 focus:ring-2 focus:ring-gold/15"
            >
              <option value="all">Toutes les régions</option>
              {regions.map((candidateRegion) => (
                <option key={candidateRegion} value={candidateRegion}>{candidateRegion}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredCandidates.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCandidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center">
          <Search size={22} className="mx-auto text-gold/70" />
          <h3 className="mt-4 font-display text-2xl text-champagne">Aucun profil trouvé</h3>
          <p className="mt-2 text-sm text-white/45">Essaie un autre nom ou une autre région.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/30 px-4 text-sm font-medium text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X size={15} /> Effacer les filtres
          </button>
        </div>
      )}
    </section>
  );
}
