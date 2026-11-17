export const legalConfig = {
  publisherName: process.env.LEGAL_PUBLISHER_NAME?.trim() ?? "",
  publicationDirector: process.env.LEGAL_PUBLICATION_DIRECTOR?.trim() ?? "",
  publisherAddress: process.env.LEGAL_PUBLISHER_ADDRESS?.trim() ?? "",
  publisherPhone: process.env.LEGAL_PUBLISHER_PHONE?.trim() ?? "",
  contactEmail: process.env.LEGAL_CONTACT_EMAIL?.trim() ?? "",
  hostName: process.env.LEGAL_HOST_NAME?.trim() ?? "",
  hostAddress: process.env.LEGAL_HOST_ADDRESS?.trim() ?? "",
  legalBases: process.env.LEGAL_PRIVACY_LEGAL_BASES?.trim() ?? "",
  retention: process.env.LEGAL_RETENTION_POLICY?.trim() ?? "",
  dataLocation: process.env.LEGAL_DATA_LOCATION?.trim() ?? "",
};

export function missingLegalFields(fields: (keyof typeof legalConfig)[]) {
  return fields.filter((field) => !legalConfig[field]);
}
