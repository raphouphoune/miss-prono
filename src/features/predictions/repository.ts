import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PredictionPageData = {
  editionStatus: "upcoming" | "open" | "closed" | "unavailable";
  deadline: string | null;
  candidateSlugs: string[];
  favoriteSlug: string | null;
  status: "draft" | "submitted";
  savedAt: string | null;
  canSaveDraft: boolean;
  canSubmit: boolean;
  scoringRules: { rank: number; points: number }[];
};

type CandidateRelation = { slug: string } | { slug: string }[] | null;
type ChoiceRow = { rank: number; candidate: CandidateRelation };
type FavoriteRow = { slug: string } | { slug: string }[] | null;

export async function getPredictionPageData2027(): Promise<PredictionPageData> {
  const unavailable: PredictionPageData = {
    editionStatus: "unavailable",
    deadline: null,
    candidateSlugs: [],
    favoriteSlug: null,
    status: "draft",
    savedAt: null,
    canSaveDraft: false,
    canSubmit: false,
    scoringRules: [],
  };

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) return unavailable;

  const { data: edition, error: editionError } = await supabase
    .from("editions")
    .select("id,status,predictions_deadline")
    .eq("slug", "miss-france-2027")
    .maybeSingle();

  if (editionError || !edition) return unavailable;

  const { data: scoringRules } = await supabase
    .from("scoring_rules")
    .select("rank,points")
    .eq("edition_id", edition.id)
    .order("rank", { ascending: true });
  const rules = (scoringRules ?? []).map((rule) => ({ rank: rule.rank, points: rule.points }));

  const deadline = edition.predictions_deadline as string | null;
  const hasTime = deadline === null || new Date(deadline).getTime() > Date.now();
  const canSaveDraft =
    (edition.status === "upcoming" && hasTime) ||
    (edition.status === "open" && deadline !== null && hasTime);
  const canSubmit = edition.status === "open" && deadline !== null && hasTime;
  const editionStatus: PredictionPageData["editionStatus"] =
    edition.status === "upcoming" && canSaveDraft ? "upcoming" : canSubmit ? "open" : "closed";

  const { data: prediction, error: predictionError } = await supabase
    .from("predictions")
    .select("id,status,updated_at,favorite_candidate:candidates!predictions_favorite_candidate_id_edition_id_fkey(slug)")
    .eq("edition_id", edition.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (predictionError) return { ...unavailable, editionStatus, scoringRules: rules };
  if (!prediction) return { editionStatus, deadline, candidateSlugs: [], favoriteSlug: null, status: "draft", savedAt: null, canSaveDraft, canSubmit, scoringRules: rules };

  const favoriteRelation = (prediction as { favorite_candidate?: FavoriteRow }).favorite_candidate;
  const favoriteCandidate = Array.isArray(favoriteRelation) ? favoriteRelation[0] : favoriteRelation;

  const { data: choices, error: choicesError } = await supabase
    .from("prediction_choices")
    .select("rank,candidate:candidates!prediction_choices_candidate_id_edition_id_fkey(slug)")
    .eq("prediction_id", prediction.id)
    .order("rank", { ascending: true });

  if (choicesError) return { ...unavailable, editionStatus, scoringRules: rules };
  const candidateSlugs = ((choices ?? []) as ChoiceRow[])
    .sort((a, b) => a.rank - b.rank)
    .flatMap(({ candidate }) => {
      const resolved = Array.isArray(candidate) ? candidate[0] : candidate;
      return resolved?.slug ? [resolved.slug] : [];
    });

  return {
    editionStatus,
    deadline,
    candidateSlugs,
    favoriteSlug: favoriteCandidate?.slug ?? null,
    status: prediction.status as "draft" | "submitted",
    savedAt: prediction.updated_at as string,
    canSaveDraft,
    canSubmit,
    scoringRules: rules,
  };
}
