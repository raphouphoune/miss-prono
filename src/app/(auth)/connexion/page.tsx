import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, AuthFields } from "@/components/auth/auth-card";
import { signIn } from "@/features/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function SignInPage({ searchParams }: PageProps) {
  const [{ status }, supabase] = await Promise.all([searchParams, createServerSupabaseClient()]);
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/pronostics");

  const notice = status === "invalid"
    ? { kind: "error" as const, text: "Adresse email ou mot de passe incorrect. Vérifie tes informations et réessaie." }
    : status === "confirmation-error"
      ? { kind: "error" as const, text: "Le lien n’a pas pu être validé. Il a peut-être déjà été utilisé, ouvert par le filtre anti-spam de ta messagerie ou expiré. Tu peux demander un nouvel email de confirmation." }
      : undefined;

  return (
    <AuthCard title="Ravie de te revoir." description="Connecte-toi pour retrouver tes pronostics et tes ligues." notice={notice} footer={<>Pas encore de compte ? <Link href={status === "confirmation-error" ? "/inscription?status=confirmation-error" : "/inscription"} className="ml-1 font-medium text-champagne underline underline-offset-4">Créer un compte ou renvoyer le lien</Link></>}>
      <form action={signIn}>
        <AuthFields submitLabel="Se connecter" />
      </form>
    </AuthCard>
  );
}
