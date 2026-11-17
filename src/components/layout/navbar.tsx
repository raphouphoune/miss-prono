import Link from "next/link";
import { Crown, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/actions";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Candidates", href: "/candidates" },
  { label: "Pronostics", href: "/pronostics" },
  { label: "Résultats", href: "/resultats" },
  { label: "Classement", href: "/classement" },
  { label: "Ligues", href: "/ligues" }
];

export async function Navbar() {
  let isAuthenticated = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  } catch {
    // Keep public pages usable when local Supabase credentials are not configured yet.
  }
  const visibleNavItems = isAuthenticated ? [...navItems, { label: "Mon profil", href: "/profil" }] : navItems;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-2" aria-label="Miss Prono, accueil">
          <Crown className="h-7 w-7 text-gold transition-transform group-hover:-rotate-6" strokeWidth={1.5} />
          <span className="font-display text-[25px] leading-none tracking-[0.08em] text-champagne">
            MISS <span className="text-gold">PRONO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Navigation principale">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-white/65 transition hover:text-gold">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button href="/pronostics" className="min-h-10 px-5"><UserRound size={16} />Mon espace</Button>
              <form action={signOut}>
                <button type="submit" className="rounded-full px-3 py-2 text-xs text-white/50 transition hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Quitter</button>
              </form>
            </div>
          ) : (
            <Button href="/connexion" className="min-h-10 px-5"><UserRound size={16} />Se connecter</Button>
          )}
        </div>
        <MobileNav items={visibleNavItems} isAuthenticated={isAuthenticated} />
      </div>
    </header>
  );
}
