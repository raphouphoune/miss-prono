import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Radio, RotateCcw } from "lucide-react";
import { publishCandidateAnnouncement, retractCandidateAnnouncement } from "@/features/ceremony/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PhaseRefresh } from "@/components/editions/phase-refresh";

const input = "min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-ivory outline-none focus:border-gold/60";
const button = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40";

export default async function AnnouncerPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) redirect("/connexion");
  const { data: edition } = await supabase.from("editions").select("id,year,status,predictions_deadline").eq("slug", "miss-france-2027").maybeSingle();
  if (!edition) redirect("/");
  const { data: allowed } = await supabase.rpc("is_ceremony_announcer", { target_edition_id: edition.id });
  if (!allowed) redirect("/");
  const [{ data: candidates }, { data: events }, { data: results }, { data: revisions }] = await Promise.all([
    supabase.from("candidates").select("id,candidate_number,name,region").eq("edition_id", edition.id).order("candidate_number"),
    supabase.from("ceremony_events").select("id,stage,title,status,published_at,candidate_id").eq("edition_id", edition.id).not("candidate_id", "is", null).order("published_at", { ascending: true }).order("id", { ascending: true }),
    supabase.from("results").select("candidate_id,final_rank,published").eq("edition_id", edition.id).eq("published", true).order("final_rank"),
    supabase.from("ceremony_event_revisions").select("id,action,snapshot,created_at").eq("edition_id", edition.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const candidateMap = new Map((candidates ?? []).map((candidate) => [candidate.id, candidate]));
  const liveEvents = (events ?? []).filter((event) => event.status === "published");
  const top12Ids = new Set(liveEvents.filter((event) => event.stage === "semi_finalists").map((event) => event.candidate_id));
  const finalistIds = new Set(liveEvents.filter((event) => event.stage === "finalists").map((event) => event.candidate_id));
  const top12Count = top12Ids.size;
  const finalistsCount = finalistIds.size;
  const placedCount = results?.length ?? 0;
  const latest = liveEvents.at(-1);
  const message = status === "published" ? "Annonce publiée et scores mis à jour." : status === "retracted" ? "Dernière annonce annulée, historique conservé et scores recalculés." : status ? "L’action n’a pas abouti. Vérifie la phase et la candidate sélectionnée." : null;
  const currentType = top12Count < 12 ? "semi_finalists" : finalistsCount < 5 ? "finalists" : placedCount < 5 ? "placement" : "done";
  const available = currentType === "semi_finalists" ? (candidates ?? []).filter((candidate) => !top12Ids.has(candidate.id)) : currentType === "finalists" ? (candidates ?? []).filter((candidate) => top12Ids.has(candidate.id) && !finalistIds.has(candidate.id)) : currentType === "placement" ? (candidates ?? []).filter((candidate) => finalistIds.has(candidate.id) && !(results ?? []).some((result) => result.candidate_id === candidate.id)) : [];
  const phaseLabel = currentType === "semi_finalists" ? `Demi-finalistes · ${top12Count}/12` : currentType === "finalists" ? `Finalistes · ${finalistsCount}/5` : currentType === "placement" ? `Places officielles · ${placedCount}/5` : "Cérémonie complète";
  const isLive = edition.status === "live";
  return <main className="section-wrap min-h-[70vh] max-w-3xl"><PhaseRefresh />
    <Link href="/profil" className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition hover:text-champagne"><ArrowLeft size={16} /> Retour au profil</Link>
    <header className="mb-8 border-b border-white/10 pb-7"><p className="section-eyebrow">Miss France {edition.year} · console mobile</p><h1 className="section-title">Relais de cérémonie</h1><p className="mt-3 text-sm leading-6 text-muted">Publie chaque annonce dès sa confirmation. Les points se recalculent automatiquement, et les membres voient les choix révélés dans leurs ligues.</p></header>
    {message && <p role="status" className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.06] p-4 text-sm text-champagne">{message}</p>}
    <section className="rounded-2xl border border-gold/20 bg-surface/70 p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-gold">Progression</p><h2 className="mt-1 font-display text-2xl text-champagne">{phaseLabel}</h2></div><Radio className={isLive ? "animate-pulse text-emerald-400" : "text-muted"} /></div>
      {!isLive ? <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted">La console est prête. Elle sera activée lorsque l’édition sera passée en direct et que les pronostics seront clôturés.</p> : currentType === "done" ? <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-100">Les 12 demi-finalistes et les cinq places officielles sont publiées.</p> : <form action={publishCandidateAnnouncement} className="mt-5 space-y-4">
        <input type="hidden" name="announcement_type" value={currentType} />
        <label className="block text-sm font-medium text-ivory">{currentType === "semi_finalists" ? "Candidate annoncée dans le Top 12" : currentType === "finalists" ? "Candidate qualifiée parmi les cinq" : `Candidate à annoncer à la place ${5 - placedCount}`}
          <select name="candidate_id" required className={`${input} mt-2`} defaultValue=""><option value="" disabled>Sélectionner une candidate</option>{available.map((candidate) => <option key={candidate.id} value={candidate.id}>{String(candidate.candidate_number).padStart(2, "0")} · {candidate.name} — {candidate.region}</option>)}</select>
        </label>
        <button disabled={!available.length} className={`${button} w-full`}><span>Publier l’annonce officielle</span><ArrowRight size={17} /></button>
        <p className="text-xs leading-5 text-muted">Le texte générique et l’étape sont générés automatiquement. Vérifie la candidate avant de publier.</p>
      </form>}
    </section>
    <section className="mt-7 rounded-2xl border border-white/10 bg-surface/50 p-5 sm:p-7"><h2 className="font-display text-2xl text-champagne">Historique des annonces</h2><ol className="mt-4 space-y-3">{liveEvents.slice().reverse().map((event) => { const candidate = event.candidate_id ? candidateMap.get(event.candidate_id) : undefined; return <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4"><div><p className="font-medium text-ivory">{candidate?.name ?? event.title} · Miss {candidate?.region ?? ""}</p><p className="mt-1 text-xs text-muted">{event.title} · {event.published_at ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(event.published_at)) : ""}</p></div>{event.id === latest?.id && <form action={retractCandidateAnnouncement}><input type="hidden" name="event_id" value={event.id} /><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300/20 px-3 text-xs text-red-100"><RotateCcw size={14} /> Annuler la dernière</button></form>}</li>; })}{!liveEvents.length && <li className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-muted">Aucune annonce publiée pour le moment.</li>}</ol></section>
    {(revisions ?? []).some((revision) => revision.action === "retracted") && <section className="mt-5 rounded-2xl border border-white/10 bg-surface/40 p-5"><h2 className="font-display text-xl text-champagne">Journal des corrections</h2><ul className="mt-3 space-y-2">{(revisions ?? []).filter((revision) => revision.action === "retracted").map((revision) => { const snapshot = revision.snapshot as { title?: string }; return <li key={revision.id} className="text-sm text-muted">Annonce annulée · {snapshot.title ?? "Annonce candidate"} · {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(new Date(revision.created_at))}</li>; })}</ul></section>}
  </main>;
}
