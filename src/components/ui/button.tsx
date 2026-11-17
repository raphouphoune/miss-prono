import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = ""
}: ButtonProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const variants = {
    primary: "bg-gradient-to-r from-gold-light to-gold text-black shadow-gold hover:-translate-y-0.5 hover:brightness-110",
    secondary: "border border-white/15 bg-white/[0.04] text-ivory hover:border-gold/50 hover:bg-white/[0.08]",
    ghost: "text-ivory/75 hover:text-gold"
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
