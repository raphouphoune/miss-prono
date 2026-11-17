import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
  notice,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  notice?: { kind: "success" | "error"; text: string };
}) {
  return (
    <main className="section-wrap flex min-h-[calc(100svh-180px)] items-center justify-center py-12 sm:py-20">
      <section className="w-full max-w-md rounded-3xl border border-gold/15 bg-[radial-gradient(ellipse_at_80%_0%,rgba(200,164,93,0.10),transparent_45%),#171614] p-6 shadow-2xl sm:p-9">
        <div className="mb-8 text-center">
          <p className="section-eyebrow">Miss Prono · Édition 2027</p>
          <h1 className="mt-3 font-display text-4xl text-champagne sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
        </div>
        {notice && (
          <p role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-6 ${notice.kind === "success" ? "border-gold/25 bg-gold/[0.07] text-champagne" : "border-red-400/25 bg-red-400/[0.07] text-red-100"}`}>
            {notice.text}
          </p>
        )}
        {children}
        {footer && <div className="mt-7 border-t border-white/[0.08] pt-5 text-center text-sm text-white/50">{footer}</div>}
      </section>
    </main>
  );
}

export function AuthFields({ submitLabel, includeProfile = false }: { submitLabel: string; includeProfile?: boolean }) {
  return (
    <>
      {includeProfile && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ivory">
              Prénom
              <input required name="first_name" type="text" autoComplete="given-name" maxLength={80} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" />
            </label>
            <label className="block text-sm font-medium text-ivory">
              Nom
              <input required name="last_name" type="text" autoComplete="family-name" maxLength={80} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-ivory">
            Pseudo
            <input required name="username" type="text" autoComplete="nickname" minLength={3} maxLength={32} pattern="[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,32}" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" placeholder="Ex. reineDuNord" />
            <span className="mt-2 block text-xs text-white/40">3 à 32 caractères : lettres, chiffres, tiret ou tiret bas.</span>
          </label>
        </>
      )}
      <label className="block text-sm font-medium text-ivory">
        Adresse email
        <input required name="email" type="email" autoComplete="email" maxLength={254} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition placeholder:text-white/30 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" placeholder="toi@exemple.fr" />
      </label>
      <label className="mt-4 block text-sm font-medium text-ivory">
        Mot de passe
        <input required name="password" type="password" autoComplete={submitLabel === "Se connecter" ? "current-password" : "new-password"} minLength={8} maxLength={72} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-ivory outline-none transition focus:border-gold/55 focus:ring-2 focus:ring-gold/15" />
        {submitLabel !== "Se connecter" && <span className="mt-2 block text-xs text-white/40">8 caractères minimum.</span>}
      </label>
      <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-gold-light to-gold px-6 text-sm font-semibold text-black shadow-gold transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#171614]">
        {submitLabel}
      </button>
    </>
  );
}
