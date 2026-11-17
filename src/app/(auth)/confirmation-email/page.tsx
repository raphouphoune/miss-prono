import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { confirmEmail } from "@/features/auth/actions";

type PageProps = { searchParams: Promise<{ token_hash?: string; type?: string }> };

export default async function ConfirmEmailPage({ searchParams }: PageProps) {
  const { token_hash: tokenHash, type } = await searchParams;
  if (!tokenHash || type !== "email") redirect("/connexion?status=confirmation-error");

  return (
    <AuthCard title="Encore un petit pas." description="Confirme ton adresse email pour activer ton compte Miss Prono.">
      <form action={confirmEmail}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-gold-light to-gold px-6 text-sm font-semibold text-black shadow-gold transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#171614]">
          Confirmer mon adresse email
        </button>
      </form>
      <p className="mt-4 text-center text-xs leading-5 text-white/40">Cette confirmation ne se fait qu’après ton clic sur le bouton.</p>
    </AuthCard>
  );
}
