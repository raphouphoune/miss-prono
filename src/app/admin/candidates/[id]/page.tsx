import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { DeleteCandidateForm } from "@/components/admin/delete-candidate-form";
import { updateCandidate } from "@/features/admin/candidate-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fieldClass = "mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
const textAreaClass = "mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-ivory outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
const messages: Record<string, string> = {
  created: "La candidate a été créée.",
  saved: "La fiche a été enregistrée.",
  "photo-saved": "La fiche et le nouveau portrait ont été enregistrés.",
  invalid: "Vérifie les valeurs saisies et les limites indiquées.",
  duplicate: "Ce numéro de candidate est déjà utilisé dans cette édition.",
  "invalid-photo": "Choisis une image JPEG, PNG ou WebP de 8 Mo maximum.",
  "photo-error": "La photo n’a pas pu être téléversée. Vérifie la migration Supabase et réessaie.",
  "save-error": "La fiche n’a pas pu être enregistrée.",
};

export default async function EditCandidatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_app_admin");
  if (adminError || !isAdmin) redirect("/");

  const { data: edition } = await supabase.from("editions").select("id,year").eq("slug", "miss-france-2027").maybeSingle();
  if (!edition) notFound();
  const { data: candidate } = await supabase.from("candidates").select("*").eq("id", id).eq("edition_id", edition.id).maybeSingle();
  if (!candidate) notFound();

  return (
    <main className="section-wrap min-h-[70vh]">
      <Link href="/admin/candidates" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold"><ArrowLeft size={15} /> Gestion des candidates</Link>
      <header className="mt-6 mb-8 border-b border-white/10 pb-7">
        <p className="section-eyebrow">Édition {edition.year} · Candidate {String(candidate.candidate_number).padStart(2, "0")}</p>
        <h1 className="section-title">Modifier une fiche</h1>
        <p className="mt-2 text-sm text-muted">Identifiant public : <span className="font-mono text-champagne">{candidate.slug}</span></p>
      </header>

      {query.status && messages[query.status] && (
        <p role={query.status === "saved" || query.status === "photo-saved" || query.status === "created" ? "status" : "alert"} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${query.status === "saved" || query.status === "photo-saved" || query.status === "created" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.06] text-red-100"}`}>
          {messages[query.status]}
        </p>
      )}

      <form action={updateCandidate} className="rounded-2xl border border-white/10 bg-surface/60 p-5 sm:p-8">
        <input type="hidden" name="candidate_id" value={candidate.id} />
        <section className="mb-8 grid gap-5 md:grid-cols-[180px_1fr]">
          <div>
            {candidate.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={candidate.photo_url} alt={`Portrait actuel de ${candidate.name}`} className="aspect-[3/4] w-full rounded-2xl border border-white/10 object-cover" />
            ) : <div className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-white/15 text-sm text-muted">Aucun portrait</div>}
          </div>
          <div className="flex flex-col justify-center">
            <label className="text-sm font-medium text-ivory">Remplacer le portrait
              <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-2 file:text-xs file:text-champagne" />
            </label>
            <p className="mt-3 text-xs leading-5 text-muted">JPEG, PNG ou WebP, 8 Mo maximum. Les photos sont enregistrées dans Supabase Storage et affichées via une URL publique.</p>
            <p className="mt-5 text-xs leading-5 text-muted">Slug d’URL immuable : <span className="font-mono text-champagne">{candidate.slug}</span></p>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-muted">Nom complet<input required name="name" minLength={2} maxLength={120} defaultValue={candidate.name} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Région<input required name="region" minLength={2} maxLength={100} defaultValue={candidate.region} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Numéro<input required name="candidate_number" type="number" min={1} max={32767} step={1} defaultValue={candidate.candidate_number} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Âge<input name="age" type="number" min={16} max={100} step={1} defaultValue={candidate.age ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Taille (cm)<input name="height_cm" type="number" min={100} max={250} step={1} defaultValue={candidate.height_cm ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Ville d’origine<input name="hometown" maxLength={200} defaultValue={candidate.hometown ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Date d’élection régionale<input name="elected_on" type="date" defaultValue={candidate.elected_on ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Lieu d’élection régionale<input name="elected_at" maxLength={120} defaultValue={candidate.elected_at ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted">Compte Instagram<input name="instagram_url" type="url" maxLength={500} defaultValue={candidate.instagram_url ?? ""} className={fieldClass} /></label>
          <label className="text-xs font-medium text-muted sm:col-span-2 xl:col-span-3">Études<textarea name="education" maxLength={2000} rows={3} defaultValue={candidate.education ?? ""} className={textAreaClass} /></label>
          <label className="text-xs font-medium text-muted sm:col-span-2 xl:col-span-3">Métier<textarea name="occupation" maxLength={2000} rows={3} defaultValue={candidate.occupation ?? ""} className={textAreaClass} /></label>
          <label className="text-xs font-medium text-muted sm:col-span-2 xl:col-span-3">Biographie<textarea name="biography" maxLength={10000} rows={5} defaultValue={candidate.biography ?? ""} className={textAreaClass} /></label>
          <label className="text-xs font-medium text-muted">Passions <span className="font-normal">(une par ligne)</span><textarea name="passions" maxLength={3000} rows={5} defaultValue={(candidate.passions ?? []).join("\n")} className={textAreaClass} /></label>
          <label className="text-xs font-medium text-muted">Engagements <span className="font-normal">(un par ligne)</span><textarea name="commitments" maxLength={3000} rows={5} defaultValue={(candidate.commitments ?? []).join("\n")} className={textAreaClass} /></label>
          <div className="grid gap-4">
            <label className="text-xs font-medium text-muted">Source officielle<input name="official_source_url" type="url" maxLength={500} defaultValue={candidate.official_source_url ?? ""} className={fieldClass} /></label>
            <label className="text-xs font-medium text-muted">Source du profil<input name="profile_source_url" type="url" maxLength={500} defaultValue={candidate.profile_source_url ?? ""} className={fieldClass} /></label>
            <label className="text-xs font-medium text-muted">Crédit photo<input name="photo_source_url" type="url" maxLength={500} defaultValue={candidate.photo_source_url ?? ""} className={fieldClass} /></label>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 text-sm font-semibold text-black transition hover:brightness-110"><Save size={16} /> Enregistrer la fiche</button>
        </div>
      </form>
      <div className="mt-4 flex justify-end"><DeleteCandidateForm candidateId={candidate.id} name={candidate.name} /></div>
    </main>
  );
}
