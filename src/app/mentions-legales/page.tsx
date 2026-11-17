import type { Metadata } from "next";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";
import { legalConfig, missingLegalFields } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mentions légales — Miss Prono", description: "Informations sur l’éditeur et l’hébergement de Miss Prono." };

const fields = [
  ["Nom ou raison sociale de l’éditeur", legalConfig.publisherName],
  ["Directeur ou directrice de la publication", legalConfig.publicationDirector],
  ["Adresse de l’éditeur", legalConfig.publisherAddress],
  ["Téléphone de l’éditeur (si applicable)", legalConfig.publisherPhone || "Non renseigné"],
  ["Adresse de contact", legalConfig.contactEmail],
  ["Nom de l’hébergeur", legalConfig.hostName],
  ["Adresse de l’hébergeur", legalConfig.hostAddress],
] as const;

export default function LegalNoticePage() {
  const missing = missingLegalFields(["publisherName", "publicationDirector", "publisherAddress", "contactEmail", "hostName", "hostAddress"]);
  return (
    <main className="section-wrap min-h-[70vh]">
      <header className="mb-9 border-b border-white/10 pb-8">
        <p className="section-eyebrow">Informations du site</p>
        <h1 className="section-title">Mentions légales</h1>
        <p className="mt-3 text-sm text-muted">Dernière mise à jour : 17 novembre 2026</p>
      </header>
      <LegalDraftNotice missingFields={missing} />
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="legal-panel">
          <h2>Éditeur</h2>
          <dl>{fields.slice(0, 5).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "À renseigner avant l’ouverture publique"}</dd></div>)}</dl>
        </section>
        <section className="legal-panel">
          <h2>Hébergement</h2>
          <dl>{fields.slice(5).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "À renseigner avant l’ouverture publique"}</dd></div>)}</dl>
          <p className="mt-4">Les services de base de données, d’authentification et de stockage de portraits sont fournis par Supabase.</p>
        </section>
        <section className="legal-panel">
          <h2>Indépendance</h2>
          <p>Miss Prono est un projet indépendant de pronostics. Il n’est ni édité par, ni affilié à l’organisation Miss France ou à ses partenaires.</p>
        </section>
        <section className="legal-panel">
          <h2>Contenus et photographies</h2>
          <p>Les informations des candidates sont publiées à partir de sources indiquées dans leurs fiches lorsque disponibles. Les photos ne doivent être utilisées qu’avec les autorisations nécessaires. Pour signaler une erreur ou une demande relative à un contenu, écris à l’adresse de contact indiquée ci-dessus.</p>
        </section>
      </div>
    </main>
  );
}
