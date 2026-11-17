import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { legalConfig, missingLegalFields } from "@/lib/legal";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact — Miss Prono" };

export default function ContactPage() {
  const missing = missingLegalFields(["contactEmail"]);
  return (
    <main className="section-wrap grid min-h-[65vh] place-items-center">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface/60 p-6 text-center sm:p-9">
        <Mail className="mx-auto text-gold" size={27} />
        <p className="mt-5 section-eyebrow">Besoin d’aide ?</p>
        <h1 className="section-title">Nous contacter</h1>
        <LegalDraftNotice missingFields={missing} reviewRequired={false} />
        {legalConfig.contactEmail ? <a href={`mailto:${legalConfig.contactEmail}`} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-black">Écrire à {legalConfig.contactEmail}</a> : <p className="mt-4 text-sm text-muted">L’adresse de contact sera affichée ici après configuration.</p>}
        <p className="mt-5 text-xs leading-5 text-muted">Pour une demande concernant tes données personnelles, indique-le dans ton message afin qu’elle soit traitée par la personne responsable.</p>
      </section>
    </main>
  );
}
