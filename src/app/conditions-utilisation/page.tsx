import type { Metadata } from "next";
import { legalConfig, missingLegalFields } from "@/lib/legal";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conditions d’utilisation — Miss Prono" };

export default function TermsPage() {
  const missing = missingLegalFields(["publisherName", "contactEmail"]);
  return (
    <main className="section-wrap min-h-[70vh]">
      <header className="mb-9 border-b border-white/10 pb-8"><p className="section-eyebrow">Règles du service</p><h1 className="section-title">Conditions d’utilisation</h1><p className="mt-3 text-sm text-muted">Dernière mise à jour : 17 novembre 2026</p></header>
      <LegalDraftNotice missingFields={missing} />
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="legal-panel"><h2>Objet du service</h2><p>Miss Prono est un jeu gratuit de pronostics autour de l’élection Miss France. Il ne propose ni mise d’argent, ni abonnement, ni gain financier. Il s’agit d’un projet indépendant, sans affiliation officielle à l’organisation Miss France.</p></section>
        <section className="legal-panel"><h2>Compte et participation</h2><p>Un compte est nécessaire pour enregistrer un pronostic, créer ou rejoindre une ligue et participer aux classements. Chaque personne reste responsable de la confidentialité de ses identifiants et des actions réalisées depuis son compte.</p></section>
        <section className="legal-panel"><h2>Pronostics et résultats</h2><p>Le pronostic complet comprend 12 candidates ordonnées. Il peut être modifié avant l’échéance configurée pour l’édition et reste privé jusqu’à cette échéance. Après clôture, les pronostics soumis peuvent être rendus visibles pour permettre la comparaison. Seuls les résultats confirmés manuellement par l’administration sont publiés.</p></section>
        <section className="legal-panel"><h2>Usage acceptable</h2><p>Les utilisateurs s’engagent à ne pas tenter d’accéder aux données ou comptes d’autrui, de contourner les règles de clôture, d’altérer le service ou de téléverser des contenus sans droits suffisants.</p></section>
        <section className="legal-panel"><h2>Disponibilité et contact</h2><p>Le service peut être interrompu temporairement pour maintenance, sécurité ou correction d’incident. Pour toute question : {legalConfig.contactEmail || "adresse de contact à renseigner avant l’ouverture publique"}.</p></section>
      </div>
    </main>
  );
}
