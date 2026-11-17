export function LegalDraftNotice({ missingFields, reviewRequired = true }: { missingFields: string[]; reviewRequired?: boolean }) {
  if (missingFields.length === 0 && !reviewRequired) return null;
  const labels: Record<string, string> = {
    publisherName: "nom ou raison sociale de l’éditeur",
    publicationDirector: "directeur de la publication",
    publisherAddress: "adresse de l’éditeur",
    publisherPhone: "téléphone de l’éditeur",
    contactEmail: "adresse de contact",
    hostName: "nom de l’hébergeur",
    hostAddress: "adresse de l’hébergeur",
    legalBases: "bases juridiques des traitements",
    retention: "durées de conservation",
    dataLocation: "région de données et informations sur les transferts",
  };
  return (
    <aside role="note" className="mb-8 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-5 text-sm leading-6 text-amber-100">
      <strong className="block font-semibold">{missingFields.length ? "Document à finaliser avant l’ouverture publique." : "Document à faire valider avant l’ouverture publique."}</strong>
      {missingFields.length > 0 && <span className="mt-1 block text-amber-100/75">Informations manquantes : {missingFields.map((field) => labels[field] ?? field).join(", ")}.</span>}
      <span className="mt-1 block text-amber-100/75">Renseigne les variables LEGAL_* dans l’environnement de production et fais valider le contenu applicable à ta situation.</span>
    </aside>
  );
}
