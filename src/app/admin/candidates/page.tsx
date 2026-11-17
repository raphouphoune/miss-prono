import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, UserRound } from "lucide-react";
import { createCandidate } from "@/features/admin/candidate-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const messages: Record<string, string> = {
  created: "La fiche candidate a été créée.",
  deleted: "La candidate a été supprimée.",
  duplicate: "Ce numéro ou ce nom est déjà utilisé dans l’édition.",
  invalid: "Vérifie le nom, la région et le numéro de candidate.",
  "invalid-photo": "Choisis une image JPEG, PNG ou WebP de 8 Mo maximum.",
  "photo-error": "La photo n’a pas pu être téléversée. Vérifie la migration Supabase et réessaie.",
  "save-error": "La fiche n’a pas pu être créée.",
  "delete-blocked": "Cette candidate est déjà liée à un pronostic ou un résultat et ne peut pas être supprimée.",
  "not-found": "Cette candidate n’a pas été trouvée dans l’édition.",
};

const fieldClass = "mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15";

export default async function AdminCandidatesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_app_admin");
  if (adminError || !isAdmin) redirect("/");

  const { data: edition } = await supabase.from("editions").select("id,year").eq("slug", "miss-france-2027").maybeSingle();
  const { data: candidates, error } = edition
    ? await supabase.from("candidates").select("id,slug,candidate_number,name,region,photo_url").eq("edition_id", edition.id).order("candidate_number", { ascending: true })
    : { data: [], error: null };

  return (
    <main className="section-wrap min-h-[70vh]">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"><ArrowLeft size={15} /> Administration</Link>
      <header className="mt-6 mb-9 border-b border-white/10 pb-8">
        <p className="section-eyebrow">{edition?.year ?? 2027} · Catalogue</p>
        <h1 className="section-title">Gestion des candidates</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Modifie les fiches et les portraits utilisés dans le catalogue public et le composeur de pronostics.</p>
      </header>

      {status && messages[status] && (
        <p role={status === "created" || status === "deleted" ? "status" : "alert"} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${status === "created" || status === "deleted" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.06] text-red-100"}`}>
          {messages[status]}
        </p>
      )}

      <section className="mb-10 rounded-2xl border border-gold/15 bg-surface/70 p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><Plus size={19} /></span>
          <div><h2 className="font-display text-2xl text-champagne">Ajouter une candidate</h2><p className="mt-1 text-sm text-muted">Les informations détaillées pourront être complétées après création.</p></div>
        </div>
        <form action={createCandidate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-muted">Nom complet<input required name="name" minLength={2} maxLength={120} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Région<input required name="region" minLength={2} maxLength={100} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Numéro<input required name="candidate_number" type="number" min={1} max={32767} step={1} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Portrait <span className="font-normal">(facultatif)</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5 block min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-xs file:text-champagne" /></label>
          <p className="text-xs leading-5 text-muted sm:col-span-2 lg:col-span-3">Images JPEG, PNG ou WebP, 8 Mo maximum. N’utilise que des photos autorisées.</p>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 text-sm font-semibold text-black transition hover:brightness-110"><ImagePlus size={16} /> Créer la fiche</button>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="section-eyebrow">Édition {edition?.year ?? 2027}</p><h2 className="mt-2 font-display text-3xl text-champagne">Candidates</h2></div><span className="text-sm text-muted">{candidates?.length ?? 0} fiches</span></div>
        {error ? (
          <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-100">Impossible de charger les candidates.</p>
        ) : !candidates?.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center"><UserRound className="mx-auto text-gold" size={26} /><p className="mt-3 text-sm text-muted">Aucune candidate dans cette édition.</p></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => (
              <Link key={candidate.id} href={`/admin/candidates/${candidate.id}`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-surface/50 p-3 transition hover:border-gold/30 hover:bg-surface">
                {candidate.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={candidate.photo_url} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                ) : <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-muted"><UserRound size={20} /></span>}
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ivory">{candidate.name}</span><span className="mt-1 block truncate text-xs text-muted">{String(candidate.candidate_number).padStart(2, "0")} · {candidate.region}</span></span>
                <ArrowRight size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-gold" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
