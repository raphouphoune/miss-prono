import { Crown, Medal, Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LeaderboardRow = {
  player_rank: number;
  username: string;
  total_points: number;
  exact_positions: number;
  top12_hits: number;
  is_provisional: boolean;
};

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("leaderboard")
    .select("player_rank,username,total_points,exact_positions,top12_hits,is_provisional")
    .eq("edition_year", 2027)
    .order("player_rank", { ascending: true });
  const players = (data ?? []) as LeaderboardRow[];

  return (
    <main className="section-wrap min-h-[70vh]">
      <header className="mb-10 text-center">
        <p className="section-eyebrow">La compétition</p>
        <h1 className="section-title">Le classement <span className="gold-text italic">des pronostiqueurs.</span></h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Retrouvez les meilleurs pronostics de la communauté Miss Prono 2027.
        </p>
      </header>

      {error ? (
        <div role="status" className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface/60 p-8 text-center">
          <Trophy className="mx-auto text-gold/70" size={30} />
          <h2 className="mt-4 font-display text-2xl text-champagne">Classement indisponible</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Le classement n’a pas pu être chargé. Réessaie un peu plus tard.</p>
        </div>
      ) : players.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface/60 px-6 py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold"><Trophy size={25} /></span>
          <h2 className="mt-5 font-display text-3xl text-champagne">Le classement se prépare</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Les scores apparaîtront dès les premières annonces de la cérémonie.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted/75">Miss France 2027</p>
        </div>
      ) : (
        <>
          {players.length >= 3 && (
            <section aria-label="Podium" className="mx-auto mb-10 grid max-w-3xl grid-cols-3 items-end gap-3 sm:gap-5">
              {[players[1], players[0], players[2]].map((player, index) => {
                const actualRank = [2, 1, 3][index];
                const Icon = actualRank === 1 ? Crown : Medal;
                return (
                  <article key={`${player.username}-${actualRank}`} className={`flex min-w-0 flex-col items-center rounded-t-2xl border border-gold/20 bg-gradient-to-b from-gold/[0.12] to-surface/50 px-2 py-5 text-center sm:px-5 ${actualRank === 1 ? "min-h-48" : "min-h-40"}`}>
                    <Icon size={actualRank === 1 ? 24 : 20} className="text-gold" />
                    <p className="mt-3 max-w-full truncate font-display text-lg text-champagne sm:text-2xl">{player.username}</p>
                    <p className="mt-1 font-semibold text-ivory">{player.total_points} pts</p>
                    <p className="mt-1 text-xs text-muted">{player.top12_hits} Top 12 · {player.exact_positions} place{player.exact_positions > 1 ? "s" : ""} exacte{player.exact_positions > 1 ? "s" : ""}</p>
                  </article>
                );
              })}
            </section>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="px-5 py-4 font-medium sm:px-7">Rang</th>
                    <th className="px-4 py-4 font-medium">Joueur</th>
                    <th className="px-4 py-4 text-right font-medium">Top 12 / Top 5 exact</th>
                    <th className="px-5 py-4 text-right font-medium sm:px-7">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={`${player.username}-${player.player_rank}`} className="border-t border-white/[0.06]">
                      <td className="px-5 py-4 font-mono text-gold sm:px-7">{String(player.player_rank).padStart(2, "0")}</td>
                      <td className="px-4 py-4 font-medium text-ivory">{player.username}</td>
                      <td className="px-4 py-4 text-right text-muted">{player.top12_hits} / 12 · {player.exact_positions} / 5</td>
                      <td className="px-5 py-4 text-right font-semibold text-champagne sm:px-7">{player.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted">Les points Top 12 valent 10 chacun; le Top 5 est compté selon le rang exact. {players.some((player) => player.is_provisional) ? "Classement provisoire, mis à jour à chaque annonce." : "Classement final."}</p>
        </>
      )}
    </main>
  );
}
