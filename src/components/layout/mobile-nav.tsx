
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { signOut } from "@/features/auth/actions";

type NavItem = {
  label: string;
  href: string;
};

export function MobileNav({ items, isAuthenticated }: { items: NavItem[]; isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ivory"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav
          aria-label="Navigation mobile"
          className="absolute inset-x-0 top-[76px] border-b border-gold/20 bg-[#101010] px-5 py-5 shadow-2xl"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/[0.05] hover:text-gold"
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link href="/pronostics" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-gold px-4 py-3 text-center text-sm font-semibold text-black">Mon espace</Link>
                <form action={signOut}>
                  <button type="submit" className="mt-2 w-full rounded-full border border-white/10 px-4 py-3 text-sm text-white/60">Se déconnecter</button>
                </form>
              </>
            ) : (
              <Link href="/connexion" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-gold px-4 py-3 text-center text-sm font-semibold text-black">Se connecter</Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
