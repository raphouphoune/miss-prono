import { ArrowRight, Crown, KeyRound, Plus, Trophy, Users } from "lucide-react";
import { InviteCodeField } from "@/components/leagues/invite-code-field";
import { createLeague, joinLeague } from "@/features/leagues/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-ivory outline-none transition placeholder:text-muted/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
const buttonClass = "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 text-sm font-semibold text-black transition hover:brightness-110 sm:w-auto";

const feedback: Record<string, string> = {
  created: "Ta ligue a été créée. Son code d’invitation apparaît dans la liste.",
  joined: "Tu as rejoint la ligue.",
  "invalid-code": "Ce code est invalide ou la période d’inscription est terminée.",
  "invalid-name": "Le nom doit contenir entre 3 et 48 caractères.",
  unavailable: "L’édition Miss France 2027 est momentanément indisponible.",
  "create-error": "La ligue n’a pas pu être créée. Réessaie dans un instant.",
};

type MemberRow = { league_id: string; user_id: string; joined_at: string };

function isFutureDeadline(deadline: string | null | undefined) {
  return !deadline || Date.parse(deadline) > Date.now();
}

export default async function LeaguesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  const { data: edition } = await supabase
    .from("editions")
    .select("id,name,year,status,predictions_deadline")
    .eq("slug", "miss-france-2027")
    .maybeSingle();
  const leaguesAvailable = Boolean(
    edition &&
      ((edition.status === "upcoming" && isFutureDeadline(edition.predictions_deadline)) ||
        (edition.status === "open" && edition.predictions_deadline && isFutureDeadline(edition.predictions_deadline))),
  );

  const { data: memberships } = userId
    ? await supabase.from("league_members").select("league_id").eq("user_id", userId)
    : { data: [] as { league_id: string }[] };
  const leagueIds = [...new Set((memberships ?? []).map((membership) => membership.league_id))];

  const [{ data: leagues }, { data: memberRows }] = leagueIds.length
    ? await Promise.all([
        supabase
          .from("leagues")
          .select("id,name,invite_code,owner_id,created_at")
          .in("id", leagueIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("league_members")
          .select("league_id,user_id,joined_at")
          .in("league_id", leagueIds)
          .order("joined_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const rows = (memberRows ?? []) as MemberRow[];
  const memberIds = [...new Set(rows.map((member) => member.user_id))];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id,username").in("id", memberIds)
    : { data: [] as { id: string; username: string }[] };
  const usernameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.username]));

  const predictionByUser = new Map<string, string>();
  const scoreByPrediction = new Map<string, { points: number; exact: number }>();
  if (edition && (edition.status === "live" || edition.status === "completed") && memberIds.length) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("id,user_id")
      .eq("edition_id", edition.id)
      .eq("status", "submitted")
      .in("user_id", memberIds);
    for (const prediction of predictions ?? []) predictionByUser.set(prediction.user_id, prediction.id);

    const predictionIds = [...predictionByUser.values()];
    if (predictionIds.length) {
      const { data: scores } = await supabase
        .from("scores")
        .select("prediction_id,total_points,exact_positions")
        .in("prediction_id", predictionIds);
      for (const score of scores ?? []) {
        scoreByPrediction.set(score.prediction_id, { points: score.total_points, exact: score.exact_positions });
      }
    }
  }

  const membersByLeague = new Map<string, MemberRow[]>();
  for (const member of rows) {
    const members = membersByLeague.get(member.league_id) ?? [];
    members.push(member);
    membersByLeague.set(member.league_id, members);
  }

  return (
    <main className="section-wrap min-h-[70vh]">
      <header className="mb-10 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <p className="section-eyebrow">Jouez ensemble</p>
          <h1 className="section-title">Vos ligues privées</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Créez votre cercle, partagez un code et retrouvez les pronostics de vos proches au même endroit.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-4 py-2 text-sm text-champagne">
          <Crown size={16} className="text-gold" /> Miss France 2027
        </div>
      </header>

      {status && feedback[status] && (
        <p role="status" className={`mb-7 rounded-xl border px-4 py-3 text-sm ${status === "created" || status === "joined" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.06] text-red-100"}`}>
          {feedback[status]}
        </p>
      )}

      <section className="mb-12 grid gap-5 lg:grid-cols-2">
        <form action={createLeague} className="rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><Plus size={19} /></span>
            <div>
              <h2 className="font-display text-2xl text-champagne">Créer une ligue</h2>
              <p className="mt-1 text-sm text-muted">Lance ton classement privé.</p>
            </div>
          </div>
          <label htmlFor="league-name" className="text-sm font-medium text-ivory">Nom de la ligue</label>
          <input id="league-name" name="name" required minLength={3} maxLength={48} placeholder="Ex. La team du Nord" className={fieldClass} />
          <button disabled={!leaguesAvailable} className={`${buttonClass} mt-5 disabled:cursor-not-allowed disabled:opacity-45`}>
            Créer ma ligue <ArrowRight size={16} />
          </button>
          {!leaguesAvailable && <p className="mt-3 text-xs text-muted">La création ouvrira avec la période de pronostics.</p>}
        </form>

        <form action={joinLeague} className="rounded-2xl border border-white/10 bg-surface/70 p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><KeyRound size={18} /></span>
            <div>
              <h2 className="font-display text-2xl text-champagne">Rejoindre une ligue</h2>
              <p className="mt-1 text-sm text-muted">Saisis le code reçu d’un proche.</p>
            </div>
          </div>
          <label htmlFor="invite-code" className="text-sm font-medium text-ivory">Code d’invitation</label>
          <input id="invite-code" name="invite_code" required minLength={8} maxLength={16} pattern="[A-Fa-f0-9]{8,16}" placeholder="Ex. 7D1A4C9F" className={`${fieldClass} font-mono uppercase tracking-[0.16em]`} />
          <button disabled={!leaguesAvailable} className={`${buttonClass} mt-5 disabled:cursor-not-allowed disabled:opacity-45`}>
            Rejoindre <ArrowRight size={16} />
          </button>
          {!leaguesAvailable && <p className="mt-3 text-xs text-muted">Les invitations seront activées à l’ouverture des pronostics.</p>}
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Votre cercle</p>
            <h2 className="mt-2 font-display text-3xl text-champagne">Mes ligues</h2>
          </div>
          <span className="text-sm text-muted">{leagues?.length ?? 0} ligue{leagues?.length === 1 ? "" : "s"}</span>
        </div>

        {!leagues?.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center">
            <Users className="mx-auto text-gold/70" size={28} />
            <h3 className="mt-4 font-display text-2xl text-champagne">Aucune ligue pour le moment</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Crée ton premier groupe ou rejoins celui d’un ami avec son code d’invitation.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {leagues.map((league) => {
              const members = membersByLeague.get(league.id) ?? [];
              const rankedMembers = [...members].sort((first, second) => {
                const firstPrediction = predictionByUser.get(first.user_id);
                const secondPrediction = predictionByUser.get(second.user_id);
                const firstScore = firstPrediction ? scoreByPrediction.get(firstPrediction) : undefined;
                const secondScore = secondPrediction ? scoreByPrediction.get(secondPrediction) : undefined;
                return (secondScore?.points ?? -1) - (firstScore?.points ?? -1) || first.joined_at.localeCompare(second.joined_at);
              });
              return (
                <article key={league.id} className="overflow-hidden rounded-2xl border border-white/10 bg-surface/60">
                  <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold"><Users size={14} /> Édition {edition?.year ?? 2027}</div>
                      <h3 className="mt-2 font-display text-2xl text-champagne">{league.name}</h3>
                      <p className="mt-1 text-sm text-muted">{members.length} membre{members.length === 1 ? "" : "s"}</p>
                    </div>
                    <InviteCodeField code={league.invite_code} leagueName={league.name} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                        <tr className="border-b border-white/[0.07]"><th className="px-5 py-3 font-medium sm:px-6">Membre</th><th className="px-4 py-3 text-right font-medium">Points</th><th className="px-5 py-3 text-right font-medium sm:px-6">Exactitude</th></tr>
                      </thead>
                      <tbody>
                        {rankedMembers.map((member, index) => {
                          const predictionId = predictionByUser.get(member.user_id);
                          const score = predictionId ? scoreByPrediction.get(predictionId) : undefined;
                          return (
                            <tr key={member.user_id} className="border-b border-white/[0.05] last:border-0">
                              <td className="px-5 py-3.5 text-ivory sm:px-6"><span className="mr-3 font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>{usernameById.get(member.user_id) ?? "Membre"}{member.user_id === league.owner_id && <span className="ml-2 text-[10px] uppercase tracking-wider text-gold">Créateur</span>}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-champagne">{score ? score.points : "—"}</td>
                              <td className="px-5 py-3.5 text-right text-muted sm:px-6">{score ? `${score.exact} / 12` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="flex items-center gap-2 px-5 py-3 text-xs text-muted sm:px-6"><Trophy size={14} className="text-gold/75" /> Les points seront calculés après publication des résultats officiels.</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
