import { cache } from "react";
import { candidates2027 } from "@/data/candidates-2027";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { Candidate } from "@/types";

type CandidateRow = {
  slug: string; candidate_number: number; name: string; region: string;
  age: number | null; height_cm: number | null; hometown: string | null;
  education: string | null; occupation: string | null; elected_on: string | null;
  elected_at: string | null; passions: string[] | null; commitments: string[] | null;
  biography: string | null; instagram_url: string | null; photo_url: string | null;
  official_source_url: string | null; profile_source_url: string | null; photo_source_url: string | null;
};

function formatElectionDate(value: string | null, fallback?: string) {
  if (!value) return fallback;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(date).replace(/^1 /, "1er ");
}

function fromRow(row: CandidateRow, fallback?: Candidate): Candidate {
  return {
    id: row.slug, slug: row.slug, number: row.candidate_number, name: row.name, region: row.region,
    imageSrc: row.photo_url || fallback?.imageSrc || "/images/candidates/placeholder.jpg",
    age: row.age ?? undefined, heightCm: row.height_cm ?? undefined, hometown: row.hometown ?? undefined,
    education: row.education ?? undefined, occupation: row.occupation ?? undefined,
    electedOn: formatElectionDate(row.elected_on, fallback?.electedOn), electedAt: row.elected_at ?? fallback?.electedAt,
    passions: row.passions ?? fallback?.passions, commitments: row.commitments ?? fallback?.commitments,
    biography: row.biography ?? fallback?.biography, instagramUrl: row.instagram_url ?? fallback?.instagramUrl,
    officialSourceUrl: row.official_source_url ?? fallback?.officialSourceUrl ?? "",
    profileSourceUrl: row.profile_source_url ?? fallback?.profileSourceUrl ?? "",
    photoSourceUrl: row.photo_source_url ?? fallback?.photoSourceUrl ?? "",
  };
}

export const getCandidates2027 = cache(async (): Promise<Candidate[]> => {
  const useLocalFallback = process.env.NODE_ENV !== "production";
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    if (useLocalFallback) return candidates2027;
    throw new Error("Supabase n’est pas configuré pour charger les candidates.");
  }

  const { data: edition, error: editionError } = await supabase.from("editions").select("id")
    .eq("slug", "miss-france-2027").maybeSingle();
  if (editionError || !edition) {
    if (editionError) console.error("Impossible de charger l’édition Miss France 2027.", editionError.message);
    if (useLocalFallback) return candidates2027;
    throw new Error("Impossible de charger l’édition Miss France 2027.");
  }

  const { data, error } = await supabase.from("candidates")
    .select("slug,candidate_number,name,region,age,height_cm,hometown,education,occupation,elected_on,elected_at,passions,commitments,biography,instagram_url,photo_url,official_source_url,profile_source_url,photo_source_url")
    .eq("edition_id", edition.id).order("candidate_number", { ascending: true });
  if (error) {
    if (error) console.error("Impossible de charger les candidates depuis Supabase.", error.message);
    if (useLocalFallback) return candidates2027;
    throw new Error("Impossible de charger les candidates depuis Supabase.");
  }

  if (!data?.length) return [];

  const localBySlug = new Map(candidates2027.map((candidate) => [candidate.slug, candidate]));
  return (data as CandidateRow[]).map((row) => fromRow(row, localBySlug.get(row.slug)));
});

export const getCandidate2027 = cache(async (slug: string) =>
  (await getCandidates2027()).find((candidate) => candidate.slug === slug)
);
