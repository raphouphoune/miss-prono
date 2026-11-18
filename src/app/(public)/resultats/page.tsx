import { CalendarDays, Crown, Heart, Radio, Trophy } from "lucide-react";
import { LiveUpdates } from "@/components/results/live-updates";
import { PhaseRefresh } from "@/components/editions/phase-refresh";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CandidateResult = {
  id: string;
  candidate_number: number;
  name: string;
  region: string;
  photo_url: string | null;
};
type ResultRow = { candidate_id: string; final_rank: number; published: boolean };
type CeremonyEvent = {
  id: string;
  stage: string;
  title: string;
  body: string | null;
  published_at: string;
  candidate_id: string | null;
  official_rank: number | null;
};
type FavoriteRelation = Pick<CandidateResult, "id" | "name" | "region"> | Pick<CandidateResult, "id" | "name" | "region">[] | null;

const stageLabels: Record<string, string> = {
  selection: "Sélection officielle",
  semi_finalists: "Demi-finalistes",
  finalists: "Finalistes",
  winner: "Résultat final",
  placement: "Classement officiel",
  custom: "Annonce",
};

export default async function ResultsPage() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return <ResultsUnavailable />;

  const { data: edition } = await supabase
    .from("editions")
    .select("id,name,year,status,ceremony_at")
    .eq("slug", "miss-france-2027")
    .maybeSingle();
  if (!edition) return <ResultsUnavailable />;

  const [{ data: resultRows }, { data: events }] = await Promise.all([
    supabase
      .from("results")
      .select("candidate_id,final_rank,published")
      .eq("edition_id", edition.id)
      .eq("published", true)
      .order("final_rank", { ascending: true }),
    supabase
      .from("ceremony_events")
      .select("id,stage,title,body,published_at,candidate_id,official_rank")
      .eq("edition_id", edition.id)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ]);

  const publicResults = ((resultRows ?? []) as ResultRow[]).filter((result) => result.published);
  const candidateIds = [...new Set([
    ...publicResults.map((result) => result.candidate_id),
    ...((events ?? []) as CeremonyEvent[]).filter((event) => event.stage === "semi_finalists" && event.candidate_id).map((event) => event.candidate_id as string),
  ])];
  const { data: candidates } = candidateIds.length
    ? await supabase.from("candidates").select("id,candidate_number,name,region,photo_url").in("id", candidateIds)
    : { data: [] as CandidateResult[] };
  const candidateById = new Map(((candidates ?? []) as CandidateResult[]).map((candidate) => [candidate.id, candidate]));
  const isLive = edition.status === "live";
  const canShowFinalResults =
    (edition.status === "live" || edition.status === "completed") &&
    publicResults.length === 5 &&
    publicResults.every((result) => candidateById.has(result.candidate_id));
  let personalFavorite: Pick<CandidateResult, "id" | "name" | "region"> | null = null;

  if (canShowFinalResults) {
    const userSupabase = await createServerSupabaseClient();
    const { data: authData } = await userSupabase.auth.getClaims();
    const userId = authData?.claims.sub;
    if (userId) {
      const { data: prediction } = await userSupabase
        .from("predictions")
        .select("favorite_candidate:candidates!predictions_favorite_candidate_id_edition_id_fkey(id,name,region)")
        .eq("edition_id", edition.id)
        .eq("user_id", userId)
        .maybeSingle();
      const relation = (prediction as { favorite_candidate?: FavoriteRelation } | null)?.favorite_candidate;
      personalFavorite = Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
    }
  }
  const winner = canShowFinalResults
    ? candidateById.get(publicResults.find((result) => result.final_rank === 1)?.candidate_id ?? "") ?? null
    : null;

  return (
    <main className="section-wrap min-h-[70vh]">
      <PhaseRefresh />
      <header className="mb-10 border-b border-white/10 pb-8 text-center">
        <p className="section-eyebrow">Miss France {edition.year}</p>
        <h1 className="section-title">Résultats <span className="gold-text italic">officiels.</span></h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Le classement et les annonces sont publiés après confirmation par l’équipe Miss Prono.
        </p>
        {isLive && <div className="mt-5 flex justify-center"><LiveUpdates editionId={edition.id} isLive={isLive} /></div>}
      </header>

      {isLive && (
        <div className="mb-9 flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-100">
          <Radio size={16} className="animate-pulse" /> La soirée est en direct
        </div>
      )}

      {canShowFinalResults ? (
        <section aria-labelledby="official-ranking-title" className="mb-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Classement final</p>
              <h2 id="official-ranking-title" className="mt-2 font-display text-3xl text-champagne">Les cinq places officielles</h2>
            </div>
            <Trophy className="hidden text-gold sm:block" size={25} />
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicResults.map((result) => {
              const candidate = candidateById.get(result.candidate_id);
              if (!candidate) return null;
              return (
                <li key={candidate.id} className={`flex items-center gap-4 rounded-2xl border p-3 ${result.final_rank === 1 ? "border-gold/35 bg-gold/[0.08] sm:col-span-2 lg:col-span-3" : "border-white/10 bg-surface/55"}`}>
                  <span className={`grid shrink-0 place-items-center rounded-xl font-display ${result.final_rank === 1 ? "size-14 bg-gold text-black sm:size-16" : "size-11 border border-gold/20 bg-black/20 text-gold"}`}>
                    {result.final_rank === 1 ? <Crown size={24} /> : String(result.final_rank).padStart(2, "0")}
                  </span>
                  {candidate.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.photo_url} alt="" className="size-14 rounded-xl object-cover object-top sm:size-16" />
                  ) : <span className="grid size-14 place-items-center rounded-xl bg-white/[0.04] text-muted">{String(candidate.candidate_number).padStart(2, "0")}</span>}
                  <div className="min-w-0">
                    <p className={`truncate font-display text-xl ${result.final_rank === 1 ? "text-champagne sm:text-2xl" : "text-ivory"}`}>{candidate.name}</p>
                    <p className="mt-1 text-sm text-muted">{candidate.region}</p>
                  </div>
                  {result.final_rank === 1 && <span className="ml-auto hidden text-xs uppercase tracking-[0.16em] text-gold sm:block">Miss France {edition.year}</span>}
                </li>
              );
            })}
          </ol>
          {personalFavorite && winner && (
            <aside className="mt-7 flex items-start gap-4 rounded-2xl border border-gold/25 bg-gold/[0.06] p-5 sm:p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-black/20 text-gold"><Heart size={19} /></span>
              <div>
                <p className="section-eyebrow">Votre coup de cœur</p>
                <h2 className="mt-1 font-display text-xl text-champagne">{personalFavorite.name} · Miss {personalFavorite.region}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {personalFavorite.id === winner.id
                    ? `Bien vu : ton coup de cœur a remporté Miss France ${edition.year} !`
                    : `La gagnante est ${winner.name}, Miss ${winner.region}.`}
                </p>
              </div>
            </aside>
          )}
        </section>
      ) : (
        <section className="mx-auto mb-16 max-w-2xl rounded-2xl border border-white/10 bg-surface/55 px-6 py-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold"><Trophy size={25} /></span>
          <h2 className="mt-5 font-display text-3xl text-champagne">Les résultats seront publiés ici</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Aucun classement final complet n’a encore été confirmé. Les annonces vérifiées de la soirée apparaîtront ci-dessous.
          </p>
          {edition.ceremony_at && <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} /> {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(edition.ceremony_at))}</p>}
        </section>
      )}

      {((events ?? []) as CeremonyEvent[]).some((event) => event.stage === "semi_finalists") && (
        <section className="mb-16" aria-labelledby="top12-title">
          <p className="section-eyebrow">Sélection officielle de la soirée</p>
          <h2 id="top12-title" className="mt-2 font-display text-3xl text-champagne">Les demi-finalistes</h2>
          <p className="mt-2 text-sm text-muted">Le Top 12 est annoncé sans ordre de classement.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{((events ?? []) as CeremonyEvent[]).filter((event) => event.stage === "semi_finalists").map((event) => {
            const candidate = event.candidate_id ? candidateById.get(event.candidate_id) : null;
            if (!candidate) return null;
            return <li key={event.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface/50 p-3">{candidate.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={candidate.photo_url} alt="" className="size-12 rounded-lg object-cover object-top" />
            ) : <span className="grid size-12 place-items-center rounded-lg bg-white/[0.04] text-muted">{String(candidate.candidate_number).padStart(2, "0")}</span>}<span><strong className="block text-sm text-ivory">{candidate.name}</strong><span className="text-xs text-muted">Miss {candidate.region}</span></span></li>;
          })}</ul>
        </section>
      )}

      <section aria-labelledby="ceremony-feed-title" className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-gold/20 bg-gold/[0.06] text-gold"><Radio size={18} /></span>
          <div>
            <p className="section-eyebrow">Suivi de la cérémonie</p>
            <h2 id="ceremony-feed-title" className="mt-1 font-display text-2xl text-champagne">Les annonces</h2>
          </div>
        </div>
        {!events?.length ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-muted">Les annonces officielles apparaîtront ici lorsqu’elles seront publiées.</p>
        ) : (
          <ol className="space-y-4">
            {(events as CeremonyEvent[]).map((event) => (
              <li key={event.id} className="relative rounded-2xl border border-white/10 bg-surface/50 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-gold">{stageLabels[event.stage] ?? "Annonce officielle"}</span>
                  <time dateTime={event.published_at} className="text-xs text-muted">{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(event.published_at))}</time>
                </div>
                <h3 className="mt-3 font-display text-2xl text-champagne">{event.title}</h3>
                {event.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{event.body}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function ResultsUnavailable() {
  return (
    <main className="section-wrap min-h-[70vh]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface/55 px-6 py-12 text-center">
        <Trophy className="mx-auto text-gold/70" size={30} />
        <h1 className="mt-4 font-display text-3xl text-champagne">Résultats indisponibles</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Les informations de l’édition ne sont pas accessibles pour le moment.</p>
      </div>
    </main>
  );
}
