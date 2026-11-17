import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, AuthFields } from "@/components/auth/auth-card";
import { resendSignupConfirmation, signUp } from "@/features/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function SignUpPage({ searchParams }: PageProps) {
  const [{ status }, supabase] = await Promise.all([searchParams, createServerSupabaseClient()]);
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/pronostics");

  const notice = status === "check-email"
    ? { kind: "success" as const, text: "Si l’adresse peut être inscrite, un email de confirmation vient d’être envoyé. Consulte ta boîte de réception." }
    : status === "invalid"
      ? { kind: "error" as const, text: "Vérifie le format de l’adresse email et choisis un mot de passe d’au moins 8 caractères." }
        : status === "pseudo-taken"
          ? { kind: "error" as const, text: "Ce pseudo est déjà utilisé. Choisis-en un autre." }
        : status === "unavailable"
        ? { kind: "error" as const, text: "La création du compte n’a pas abouti. Réessaie dans quelques instants." }
        : status === "resent"
          ? { kind: "success" as const, text: "Si un compte attend une confirmation pour cette adresse, un nouvel email vient d’être demandé." }
          : status === "confirmation-error"
            ? { kind: "error" as const, text: "Demande un nouveau lien ci-dessous. Le lien précédent a pu être consommé par un filtre de messagerie ou avoir expiré." }
            : status === "invalid-email"
              ? { kind: "error" as const, text: "Saisis une adresse email valide pour demander un nouveau lien." }
        : undefined;

  return (
    <AuthCard title="Rejoins l’aventure." description="Crée ton compte gratuit pour préparer ton Top 12 et jouer avec tes proches." notice={notice} footer={<>Tu as déjà un compte ? <Link href="/connexion" className="ml-1 font-medium text-champagne underline underline-offset-4">Se connecter</Link></>}>
      <form action={signUp}>
        <AuthFields submitLabel="Créer mon compte" includeProfile />
      </form>
      <p className="mt-4 text-center text-xs leading-5 text-white/40">En créant un compte, tu reconnais avoir lu les <Link href="/conditions-utilisation" className="text-champagne underline underline-offset-2">conditions d’utilisation</Link> et la <Link href="/confidentialite" className="text-champagne underline underline-offset-2">politique de confidentialité</Link>.</p>
      {(status === "confirmation-error" || status === "resent" || status === "invalid-email") && (
        <form action={resendSignupConfirmation} className="mt-7 border-t border-white/[0.08] pt-6">
          <label className="block text-sm font-medium text-ivory">
            Renvoyer l’email de confirmation
            <input required name="email" type="email" autoComplete="email" maxLength={254} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" placeholder="toi@exemple.fr" />
          </label>
          <button type="submit" className="mt-3 min-h-11 w-full rounded-full border border-gold/30 px-4 text-sm font-medium text-champagne transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Renvoyer le lien</button>
        </form>
      )}
    </AuthCard>
  );
}
