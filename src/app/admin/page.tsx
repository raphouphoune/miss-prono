import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Clock3, ListOrdered, Radio, ShieldCheck, Users } from "lucide-react";
import { saveCeremonyEvent, saveOfficialResults, saveScoringRules } from "@/features/admin/actions";
import { calculateScores } from "@/features/scoring/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PhaseRefresh } from "@/components/editions/phase-refresh";

const messages: Record<string, string> = {
  unavailable: "L’édition 2027 est introuvable.",
  forbidden: "Cette action est réservée aux administrateurs.",
  "results-incomplete": "Publie exactement les 5 places officielles avant le calcul.",
  "rules-incomplete": "Configure et valide les 12 règles de points de cette édition avant le calcul.",
  "deadline-open": "Le calcul restera fermé jusqu’à la clôture des pronostics.",
  "calculation-error": "Le calcul n’a pas abouti. Consulte les journaux serveur pour le détail.",
  "invalid-results": "Sélectionne 5 candidates différentes, une pour chaque place du Top 5.",
  "results-error": "Les résultats n’ont pas pu être enregistrés. Vérifie les candidates de l’édition.",
  "publish-closed": "La publication sera disponible après la clôture, lorsque l’édition sera en direct ou terminée.",
  "invalid-rules": "Saisis une valeur entière positive ou nulle pour les 5 rangs exacts et le Top 12.",
  "rules-error": "Le barème n’a pas pu être enregistré.",
  "invalid-event": "Vérifie l’étape, le titre et le contenu de l’annonce.",
  "event-error": "L’annonce n’a pas pu être enregistrée.",
  "event-publish-closed": "Les annonces publiques ne peuvent être publiées que lorsque l’édition est en direct ou terminée.",
  "invalid-edition": "Vérifie la phase et les dates saisies.",
  "invalid-edition-phase": "Cette phase n’est pas compatible avec la date de clôture. Vérifie la date et l’état de l’édition.",
  "edition-results-required": "Publie les 12 annonces du Top 12 et les cinq places officielles avant de terminer l’édition.",
};

const ceremonyStages = [
  { value: "selection", label: "Candidates sélectionnées" },
  { value: "semi_finalists", label: "Demi-finalistes" },
  { value: "finalists", label: "Finalistes" },
  { value: "winner", label: "Résultat final" },
  { value: "custom", label: "Annonce personnalisée" },
];

function isPastDeadline(deadline: string | null) {
  return Boolean(deadline && Date.parse(deadline) <= Date.now());
}

const fieldClass = "min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
const submitClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; count?: string }> }) {
  const { status, count } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_app_admin");
  if (adminError || !isAdmin) redirect("/");

  const { data: edition } = await supabase
    .from("editions")
    .select("id,name,year,status,predictions_deadline,ceremony_at")
    .eq("slug", "miss-france-2027")
    .maybeSingle();

  const [{ data: candidates }, { data: results }, { data: rules }, { data: events }] = edition
    ? await Promise.all([
        supabase
          .from("candidates")
          .select("id,candidate_number,name,region")
          .eq("edition_id", edition.id)
          .order("candidate_number", { ascending: true }),
        supabase
          .from("results")
          .select("candidate_id,final_rank,published")
          .eq("edition_id", edition.id)
          .order("final_rank", { ascending: true }),
        supabase
          .from("scoring_rules")
          .select("rank,points")
          .eq("edition_id", edition.id)
          .order("rank", { ascending: true }),
        supabase
          .from("ceremony_events")
          .select("id,stage,title,body,status,published_at,created_at")
          .eq("edition_id", edition.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const resultByRank = new Map((results ?? []).map((result) => [result.final_rank, result]));
  const pointsByRank = new Map((rules ?? []).map((rule) => [rule.rank, rule.points]));
  const resultsPublished = results?.length === 5 && results.every((result) => result.published);
  const canPublishResults = Boolean(
    edition &&
      (edition.status === "live" || edition.status === "completed") &&
      isPastDeadline(edition.predictions_deadline),
  );

  return (
    <main className="section-wrap min-h-[70vh]">
      <PhaseRefresh />
      <Link href="/profil" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition hover:text-champagne"><ArrowLeft size={16} /> Retour au profil</Link>
      <header className="mb-10 border-b border-white/10 pb-8">
        <p className="section-eyebrow">Espace sécurisé</p>
        <h1 className="section-title">Administration</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Saisis les données officielles et contrôle le calcul des scores pour l’édition Miss France 2027.
        </p>
      </header>

      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/candidates" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 text-sm font-medium text-champagne transition hover:border-gold/40 hover:bg-gold/[0.09]"><Users size={16} /> Gérer les candidates <ArrowRight size={15} /></Link>
          <Link href="/admin/annonciateurs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 text-sm font-medium text-champagne transition hover:border-gold/40 hover:bg-gold/[0.09]"><Radio size={16} /> Gérer les annonceurs <ArrowRight size={15} /></Link>
          <Link href="/annonceur" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 text-sm font-medium text-champagne transition hover:border-gold/40 hover:bg-gold/[0.09]"><Radio size={16} /> Console de cérémonie <ArrowRight size={15} /></Link>
        </div>
      </div>

      {status === "calculated" ? (
        <p role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
          Calcul terminé : {count ?? 0} pronostic(s) traité(s). Le calcul peut être relancé après une correction officielle.
        </p>
      ) : status === "results-published" || status === "results-saved" || status === "rules-saved" || status === "event-published" || status === "event-saved" || status === "edition-saved" ? (
        <p role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
          {status === "results-published" ? "Les cinq places officielles sont publiées et les scores recalculés." : status === "results-saved" ? "Le Top 5 a été enregistré en brouillon, sans publication publique." : status === "rules-saved" ? "Les règles de points ont été enregistrées." : status === "event-published" ? "L’annonce est publiée et visible dans le fil de la soirée." : status === "event-saved" ? "L’annonce est enregistrée en brouillon." : "La phase et les dates de l’édition ont été mises à jour."}
        </p>
      ) : status && messages[status] ? (
        <p role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-100">{messages[status]}</p>
      ) : null}

      {edition && (
        <section className="mb-6 rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.18em] text-gold">{edition.year} · Paramètres d’édition</p>
            <h2 className="mt-1 font-display text-2xl text-champagne">Phases automatiques</h2>
            <p className="mt-2 text-sm leading-6 text-muted">La phase est actualisée automatiquement chaque minute selon l’heure de Paris. Aucune action manuelle n’est nécessaire.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <li className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gold">Pronostics ouverts</p><p className="mt-2 text-sm text-ivory">Jusqu’au 11 décembre 2026 à 23 h 59</p></li>
            <li className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gold">Pronostics fermés</p><p className="mt-2 text-sm text-ivory">À partir du 12 décembre à 00 h 00</p></li>
            <li className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gold">En direct</p><p className="mt-2 text-sm text-ivory">12 décembre 2026 à 21 h 10</p></li>
            <li className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-gold">Terminée</p><p className="mt-2 text-sm text-ivory">13 décembre 2026 à 02 h 00</p></li>
          </ol>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><ListOrdered size={20} /></span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Résultats officiels</p>
              <h2 className="mt-1 font-display text-2xl text-champagne">Classement final</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Saisis les cinq places officielles du Top 5. Les sept autres demi-finalistes ne sont pas classées.</p>
            </div>
          </div>

          {!candidates?.length ? (
            <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100">Aucune candidate n’est disponible pour cette édition.</p>
          ) : (
            <form action={saveOfficialResults} className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const rank = index + 1;
                  const result = resultByRank.get(rank);
                  return (
                    <label key={rank} className="block text-xs font-medium text-muted">
                      Rang {String(rank).padStart(2, "0")}
                      <select required name="candidate_ids" defaultValue={result?.candidate_id ?? ""} className={`${fieldClass} mt-1.5`}>
                        <option value="" disabled>Choisir une candidate</option>
                        {candidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {String(candidate.candidate_number).padStart(2, "0")} · {candidate.name} — {candidate.region}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button name="publish_results" value="false" className={`${submitClass} border border-white/10 bg-surface text-ivory hover:bg-white/[0.06]`}>
                  Enregistrer en brouillon
                </button>
                <button name="publish_results" value="true" disabled={!canPublishResults} className={submitClass}>
                  Publier les résultats <ArrowRight size={15} />
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                {resultsPublished ? "Les cinq places officielles sont publiées. Les annonces en direct actualisent ensuite les scores automatiquement." : canPublishResults ? "La publication confirme les places du Top 5." : "La publication sera activée après la clôture et le passage de l’édition en direct."}
              </p>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><ShieldCheck size={20} /></span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Barème de l’édition</p>
              <h2 className="mt-1 font-display text-2xl text-champagne">Barème de la soirée</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Points exacts pour les cinq places, plus une valeur unique pour chaque candidate du Top 12 trouvée, quel que soit son rang prédit.</p>
            </div>
          </div>

          <form action={saveScoringRules} className="mt-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => {
                const rank = index < 5 ? index + 1 : 6;
                const points = pointsByRank.get(rank);
                return (
                  <label key={rank} className="block text-xs font-medium text-muted">
                    {rank <= 5 ? `Place ${rank}${rank === 1 ? " · Miss France" : ""}` : "Candidate trouvée dans le Top 12"}
                    <input required type="number" name="points" min={0} max={2147483647} step={1} defaultValue={points ?? ""} placeholder="Points" className={`${fieldClass} mt-1.5`} />
                  </label>
                );
              })}
            </div>
            <button className={`${submitClass} mt-5`}>
              Enregistrer le barème <ArrowRight size={15} />
            </button>
            <p className="mt-3 text-xs leading-5 text-muted">Enregistrer un nouveau barème invalide les scores afin qu’ils soient recalculés avec ces valeurs.</p>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface/70 p-5 sm:col-span-2 sm:p-7 xl:col-span-2">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><Calculator size={20} /></span>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{edition?.year ?? 2027} · {edition?.status ?? "édition indisponible"}</p>
                <h2 className="mt-1 font-display text-2xl text-champagne">Calcul des scores</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Les points sont recalculés à chaque annonce. Ils restent provisoires jusqu’à la publication des 12 demi-finalistes et des cinq places officielles.</p>
              </div>
            </div>
            <form action={calculateScores}>
              <button disabled={!resultsPublished || rules?.length !== 12} className={`${submitClass} w-full sm:w-auto`}>
                Calculer ou recalculer <ArrowRight size={15} />
              </button>
            </form>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted"><CheckCircle2 size={14} className="text-gold/80" /> Scores traités avec les règles configurées pour cette édition.</p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
        <div className="mb-6 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><Radio size={20} /></span>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Mode soirée</p>
            <h2 className="mt-1 font-display text-2xl text-champagne">Fil des annonces</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Saisis uniquement les informations confirmées. Les brouillons restent privés; la publication est réservée à l’édition en direct ou terminée.</p>
          </div>
        </div>

        <form action={saveCeremonyEvent} className="rounded-xl border border-gold/15 bg-gold/[0.035] p-4 sm:p-5">
          <h3 className="font-semibold text-ivory">Nouvelle annonce</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-xs font-medium text-muted">Étape
              <select name="stage" required defaultValue="selection" className={`${fieldClass} mt-1.5`}>
                {ceremonyStages.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">Titre
              <input name="title" required minLength={3} maxLength={100} placeholder="Ex. Les 12 demi-finalistes sont connues" className={`${fieldClass} mt-1.5`} />
            </label>
            <label className="block text-xs font-medium text-muted md:col-span-2">Détails confirmés <span className="font-normal">(facultatif)</span>
              <textarea name="body" maxLength={2000} rows={3} placeholder="Ajoute les précisions vérifiées à communiquer aux joueurs." className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button name="publish_event" value="false" className={`${submitClass} border border-white/10 bg-surface text-ivory hover:bg-white/[0.06]`}>
              Enregistrer en brouillon
            </button>
            <button name="publish_event" value="true" disabled={edition?.status !== "live" && edition?.status !== "completed"} className={submitClass}>
              Publier l’annonce <ArrowRight size={15} />
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-4">
          {!events?.length ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted">Aucune annonce enregistrée pour le moment.</p>
          ) : events.map((event) => (
            <form key={event.id} action={saveCeremonyEvent} className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <input type="hidden" name="event_id" value={event.id} />
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${event.status === "published" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-white/10 bg-white/[0.03] text-muted"}`}>
                  {event.status === "published" ? <Radio size={13} /> : <Clock3 size={13} />}
                  {event.status === "published" ? "Publié" : "Brouillon"}
                  {event.published_at && <time dateTime={event.published_at}> · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(event.published_at))}</time>}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-xs font-medium text-muted">Étape
                  <select name="stage" required defaultValue={event.stage} className={`${fieldClass} mt-1.5`}>
                    {ceremonyStages.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium text-muted">Titre
                  <input name="title" required minLength={3} maxLength={100} defaultValue={event.title} className={`${fieldClass} mt-1.5`} />
                </label>
                <label className="block text-xs font-medium text-muted md:col-span-2">Détails
                  <textarea name="body" maxLength={2000} rows={3} defaultValue={event.body ?? ""} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button name="publish_event" value="false" className={`${submitClass} border border-white/10 bg-surface text-ivory hover:bg-white/[0.06]`}>
                  Enregistrer en brouillon
                </button>
                <button name="publish_event" value="true" disabled={edition?.status !== "live" && edition?.status !== "completed"} className={submitClass}>
                  {event.status === "published" ? "Mettre à jour la publication" : "Publier l’annonce"} <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
