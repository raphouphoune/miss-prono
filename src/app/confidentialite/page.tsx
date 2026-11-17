import type { Metadata } from "next";
import { LegalDraftNotice } from "@/components/legal/legal-draft-notice";
import { legalConfig, missingLegalFields } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confidentialité — Miss Prono", description: "Données personnelles traitées par Miss Prono et droits des utilisateurs." };

export default function PrivacyPage() {
  const missing = missingLegalFields(["publisherName", "contactEmail", "legalBases", "retention", "dataLocation"]);
  return (
    <main className="section-wrap min-h-[70vh]">
      <header className="mb-9 border-b border-white/10 pb-8">
        <p className="section-eyebrow">Données personnelles</p>
        <h1 className="section-title">Confidentialité</h1>
        <p className="mt-3 text-sm text-muted">Dernière mise à jour : 17 novembre 2026</p>
      </header>
      <LegalDraftNotice missingFields={missing} />
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="legal-panel"><h2>Responsable et contact</h2><p>Le responsable du traitement est {legalConfig.publisherName || "l’éditeur du site, à identifier avant l’ouverture publique"}. Pour toute demande relative aux données personnelles : {legalConfig.contactEmail || "adresse de contact à renseigner"}.</p></section>
        <section className="legal-panel"><h2>Données et finalités</h2><ul><li>Email et données d’authentification pour créer et sécuriser un compte.</li><li>Prénom et nom dans un espace privé, et pseudo dans le profil public.</li><li>Pronostics classés, coup de cœur, appartenance aux ligues et scores pour fournir les fonctionnalités de jeu.</li><li>Messages envoyés à l’administration et données techniques nécessaires à la sécurité et au fonctionnement du service.</li></ul><p className="mt-3">Les cartes de partage sont générées sur l’appareil à partir des choix affichés. Elles ne sont pas publiées par le service; si vous les partagez, les personnes qui les reçoivent pourront voir leur contenu.</p><p className="mt-3">Aucune donnée de paiement n’est demandée. Aucune publicité ou mesure d’audience n’est configurée dans l’application à ce jour.</p></section>
        <section className="legal-panel"><h2>Base juridique et durée</h2><p>Base juridique et durée de conservation à confirmer par l’éditeur avant ouverture publique : {legalConfig.legalBases || "bases juridiques à déterminer selon les finalités"}; {legalConfig.retention || "durées de conservation à définir par catégorie de données"}.</p></section>
        <section className="legal-panel"><h2>Destinataires et localisation</h2><p>Les données sont accessibles aux personnes qui administrent le service et aux prestataires techniques nécessaires à son fonctionnement, notamment Supabase pour l’authentification, la base de données et le stockage, ainsi que l’hébergeur de l’application.</p><p className="mt-3">Région de traitement et éventuels transferts hors EEE à vérifier dans les contrats et paramètres des prestataires : {legalConfig.dataLocation || "à renseigner avant l’ouverture publique"}.</p></section>
        <section className="legal-panel"><h2>Cookies et stockage local</h2><p>La connexion utilise des cookies de session nécessaires à l’authentification. Le composeur conserve aussi une copie locale du brouillon de pronostic dans le stockage du navigateur pour éviter sa perte. Aucun traceur publicitaire ou outil d’analyse n’est intégré actuellement; revérifie ce point si de nouveaux outils sont ajoutés.</p></section>
        <section className="legal-panel"><h2>Vos droits</h2><p>Selon les conditions prévues par la réglementation applicable, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, ou vous opposer à certains traitements. Adressez votre demande à {legalConfig.contactEmail || "l’adresse de contact à renseigner"}. Vous pouvez également déposer une réclamation auprès de la CNIL.</p></section>
        <section className="legal-panel"><h2>Sécurité et visibilité</h2><p>Les informations privées du profil et les pronostics sont protégés par les contrôles d’accès de Supabase. Le pseudo est public. Les pronostics soumis ne deviennent consultables qu’après la clôture définie pour l’édition, conformément aux règles du produit.</p></section>
      </div>
    </main>
  );
}
