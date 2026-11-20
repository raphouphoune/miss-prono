import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Radio, ShieldCheck } from "lucide-react";
import { updateProfile } from "@/features/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function ProfilePage({ searchParams }: PageProps) {
  const [{ status }, supabase] = await Promise.all([searchParams, createServerSupabaseClient()]);
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/connexion");

  const [profileResult, privateProfileResult, adminResult, editionResult] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("private_profiles").select("first_name,last_name").eq("id", userId).maybeSingle(),
    supabase.rpc("is_app_admin"),
    supabase.from("editions").select("id").eq("slug", "miss-france-2027").maybeSingle(),
  ]);
  const { data: isAnnouncer } = editionResult.data
    ? await supabase.rpc("is_ceremony_announcer", { target_edition_id: editionResult.data.id })
    : { data: false };

  const notice = status === "saved"
    ? { style: "border-gold/25 bg-gold/[0.07] text-champagne", text: "Ton profil a été mis à jour." }
    : status === "pseudo-taken"
      ? { style: "border-red-400/25 bg-red-400/[0.07] text-red-100", text: "Ce pseudo est déjà utilisé. Choisis-en un autre." }
      : status === "invalid"
        ? { style: "border-red-400/25 bg-red-400/[0.07] text-red-100", text: "Vérifie les champs : pseudo de 3 à 32 caractères, sans espace." }
        : status === "unavailable" || profileResult.error || privateProfileResult.error
          ? { style: "border-red-400/25 bg-red-400/[0.07] text-red-100", text: "Le profil n’a pas pu être chargé ou enregistré. Vérifie que la dernière migration Supabase est appliquée." }
          : null;

  const fieldClass = "mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15";

  return (
    <main className="section-wrap min-h-[calc(100svh-180px)] py-12 sm:py-20">
      <section className="mx-auto max-w-2xl rounded-3xl border border-gold/15 bg-[radial-gradient(ellipse_at_80%_0%,rgba(200,164,93,0.10),transparent_45%),#171614] p-6 sm:p-10">
        <p className="section-eyebrow">Mon compte</p>
        <h1 className="mt-3 font-display text-4xl text-champagne sm:text-5xl">Mon profil</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Ton pseudo est visible par les autres joueurs. Ton prénom et ton nom restent privés.</p>

        {(adminResult.data || isAnnouncer) && <nav aria-label="Espaces réservés" className="mt-6 grid gap-3 sm:grid-cols-2">
          {adminResult.data && <Link href="/admin" className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 text-sm font-medium text-champagne transition hover:bg-gold/10"><span className="inline-flex items-center gap-2"><ShieldCheck size={17} /> Administration</span><ArrowRight size={16} /> </Link>}
          {isAnnouncer && <Link href="/annonceur" className="inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 text-sm font-medium text-champagne transition hover:bg-gold/10"><span className="inline-flex items-center gap-2"><Radio size={17} /> Console annonceur</span><ArrowRight size={16} /> </Link>}
        </nav>}

        {notice && <p role="status" className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${notice.style}`}>{notice.text}</p>}

        <form action={updateProfile} className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ivory">Prénom
              <input required name="first_name" type="text" autoComplete="given-name" maxLength={80} defaultValue={privateProfileResult.data?.first_name ?? ""} className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-ivory">Nom
              <input required name="last_name" type="text" autoComplete="family-name" maxLength={80} defaultValue={privateProfileResult.data?.last_name ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className="mt-5 block text-sm font-medium text-ivory">Pseudo
            <input required name="username" type="text" autoComplete="nickname" minLength={3} maxLength={32} pattern="[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,32}" defaultValue={profileResult.data?.username ?? ""} className={fieldClass} />
            <span className="mt-2 block text-xs text-white/40">3 à 32 caractères : lettres, chiffres, tiret ou tiret bas.</span>
          </label>
          <button type="submit" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-gold-light to-gold px-7 text-sm font-semibold text-black shadow-gold transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#171614]">Enregistrer mon profil</button>
        </form>
      </section>
    </main>
  );
}
