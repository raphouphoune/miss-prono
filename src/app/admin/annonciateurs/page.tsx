import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { setCeremonyAnnouncer } from "@/features/ceremony/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const btn = "inline-flex min-h-10 items-center justify-center rounded-xl border border-gold/25 px-4 text-sm text-champagne hover:bg-gold/10";

export default async function AnnouncersAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) redirect("/connexion");
  const { data: isAdmin } = await supabase.rpc("is_app_admin");
  if (!isAdmin) redirect("/");
  const { data: edition } = await supabase.from("editions").select("id,year").eq("slug", "miss-france-2027").maybeSingle();
  if (!edition) redirect("/admin?status=unavailable");
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("id,username").order("username"),
    supabase.from("ceremony_announcers").select("user_id").eq("edition_id", edition.id),
  ]);
  const assigned = new Set((assignments ?? []).map((row) => row.user_id));
  const notice = status === "added" ? "Accès annonceur accordé." : status === "removed" ? "Accès annonceur retiré." : status ? "La modification n’a pas pu être enregistrée." : null;
  return <main className="section-wrap min-h-[70vh]">
    <Link href="/admin" className="mb-7 inline-flex items-center gap-2 text-sm text-muted hover:text-champagne"><ArrowLeft size={16} /> Administration</Link>
    <header className="mb-8 border-b border-white/10 pb-7"><p className="section-eyebrow">Miss France {edition.year}</p><h1 className="section-title">Accès annonceurs</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Choisis les comptes autorisés à publier les annonces officielles pendant la cérémonie. Les administrateurs conservent aussi cet accès.</p></header>
    {notice && <p role="status" className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.06] p-4 text-sm text-champagne">{notice}</p>}
    <Link href="/annonceur" className={`${btn} mb-5 gap-2`}><Radio size={16} /> Ouvrir la console annonceur</Link>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/60">
      {(profiles ?? []).map((profile) => {
        const hasAccess = assigned.has(profile.id);
        return <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0">
          <span className="font-medium text-ivory">{profile.username}</span>
          <form action={setCeremonyAnnouncer}><input type="hidden" name="user_id" value={profile.id} /><input type="hidden" name="allow" value={String(!hasAccess)} /><button className={btn}>{hasAccess ? "Retirer l’accès" : "Autoriser"}</button></form>
        </div>;
      })}
      {!profiles?.length && <p className="p-6 text-sm text-muted">Aucun utilisateur inscrit pour le moment.</p>}
    </div>
  </main>;
}
