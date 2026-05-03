export const DOC_TYPES: Record<string, string> = {
  // État civil
  BIRTH_CERTIFICATE: "Acte de naissance",
  MARRIAGE_CERTIFICATE: "Acte de mariage",
  DEATH_CERTIFICATE: "Acte de décès",
  INDIVIDUALITY_CERTIFICATE: "Certificat d'individualité",
  CELIBACY_CERTIFICATE: "Certificat de célibat",
  COLLECTIVE_LIFE_CERTIFICATE: "Certificat de vie collective",
  // Identité & nationalité
  CIP_ATTESTATION: "Attestation CIP (ANIP)",
  NATIONALITY_CERTIFICATE: "Certificat de nationalité",
  CEDEAO_PASSPORT_ATTESTATION: "Attestation de passeport CEDEAO",
  // Judiciaire
  CRIMINAL_RECORD: "Casier judiciaire (Bulletin n°3)",
  NON_CONVICTION_CERTIFICATE: "Certificat de non-condamnation",
  NON_BANKRUPTCY_CERTIFICATE: "Certificat de non-faillite",
  // Fiscal
  TAX_CERTIFICATE: "Quitus fiscal",
  IFU_ATTESTATION: "Attestation IFU",
  VAT_PAYMENT_CERTIFICATE: "Attestation de paiement TVA",
  // Municipal
  RESIDENCE_CERTIFICATE: "Certificat de résidence",
  DOMICILE_CERTIFICATE: "Certificat de domicile",
  // Professionnel
  PATENTE_CERTIFICATE: "Quitus patente",
};

export const DOC_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  CIVIL: {
    label: "État civil",
    types: [
      "BIRTH_CERTIFICATE",
      "MARRIAGE_CERTIFICATE",
      "DEATH_CERTIFICATE",
      "INDIVIDUALITY_CERTIFICATE",
      "CELIBACY_CERTIFICATE",
      "COLLECTIVE_LIFE_CERTIFICATE",
    ],
  },
  IDENTITY: {
    label: "Identité et nationalité",
    types: ["CIP_ATTESTATION", "NATIONALITY_CERTIFICATE", "CEDEAO_PASSPORT_ATTESTATION"],
  },
  JUDICIAL: {
    label: "Judiciaire",
    types: ["CRIMINAL_RECORD", "NON_CONVICTION_CERTIFICATE", "NON_BANKRUPTCY_CERTIFICATE"],
  },
  FISCAL: {
    label: "Fiscal",
    types: ["TAX_CERTIFICATE", "IFU_ATTESTATION", "VAT_PAYMENT_CERTIFICATE"],
  },
  MUNICIPAL: {
    label: "Municipal",
    types: ["RESIDENCE_CERTIFICATE", "DOMICILE_CERTIFICATE"],
  },
  PROFESSIONAL: {
    label: "Professionnel",
    types: ["PATENTE_CERTIFICATE"],
  },
};

export const REQUEST_STATUS: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "En attente de paiement", color: "bg-orange-100 text-orange-800" },
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  VERIFYING: { label: "Vérification d'identité", color: "bg-blue-100 text-blue-800" },
  CHECKING: { label: "Contrôle des sources", color: "bg-blue-100 text-blue-800" },
  GENERATING: { label: "Génération du document", color: "bg-indigo-100 text-indigo-800" },
  SIGNING: { label: "Signature numérique", color: "bg-purple-100 text-purple-800" },
  READY: { label: "Prêt", color: "bg-emerald-100 text-emerald-800" },
  EXCEPTION: { label: "Exception — revue manuelle", color: "bg-orange-100 text-orange-800" },
  EXTRACTION_REQUIRED: { label: "Numérisation en cours", color: "bg-violet-100 text-violet-800" },
  REJECTED: { label: "Rejeté", color: "bg-red-100 text-red-800" },
};

export const PIPELINE_STEPS = [
  { key: "VERIFYING", label: "Vérification d'identité ANIP", description: "Authentification du citoyen via le Registre National des Personnes Physiques" },
  { key: "CHECKING", label: "Contrôle des sources natives", description: "Interrogation des bases sectorielles (Justice, État civil, DGI)" },
  { key: "GENERATING", label: "Génération du document officiel", description: "Composition du document selon le modèle réglementaire" },
  { key: "SIGNING", label: "Signature cryptographique", description: "Apposition de la signature numérique de l'autorité émettrice" },
  { key: "READY", label: "Document délivré", description: "Document scellé, vérifiable publiquement, prêt au téléchargement" },
] as const;

export type AuthorityCode = "COUR_APPEL_COTONOU" | "MAIRIE_COTONOU" | "DGI" | "ANIP" | "DTT";

export const AUTHORITIES: Record<AuthorityCode, { name: string; shortName: string; subtitle: string }> = {
  COUR_APPEL_COTONOU: {
    name: "Cour d'Appel de Cotonou",
    shortName: "CA-COT",
    subtitle: "Ministère de la Justice et de la Législation",
  },
  MAIRIE_COTONOU: {
    name: "Mairie de Cotonou",
    shortName: "MAIRIE-COT",
    subtitle: "Service de l'État Civil",
  },
  DGI: {
    name: "Direction Générale des Impôts",
    shortName: "DGI",
    subtitle: "Ministère de l'Économie et des Finances",
  },
  ANIP: {
    name: "Agence Nationale d'Identification des Personnes",
    shortName: "ANIP",
    subtitle: "Présidence de la République",
  },
  DTT: {
    name: "Direction des Transports Terrestres",
    shortName: "DTT",
    subtitle: "Ministère des Infrastructures et Transports",
  },
};

export const DOC_AUTHORITY: Record<string, AuthorityCode> = {
  // Mairie
  BIRTH_CERTIFICATE: "MAIRIE_COTONOU",
  MARRIAGE_CERTIFICATE: "MAIRIE_COTONOU",
  DEATH_CERTIFICATE: "MAIRIE_COTONOU",
  RESIDENCE_CERTIFICATE: "MAIRIE_COTONOU",
  DOMICILE_CERTIFICATE: "MAIRIE_COTONOU",
  CELIBACY_CERTIFICATE: "MAIRIE_COTONOU",
  COLLECTIVE_LIFE_CERTIFICATE: "MAIRIE_COTONOU",
  // Cour d'Appel
  CRIMINAL_RECORD: "COUR_APPEL_COTONOU",
  NATIONALITY_CERTIFICATE: "COUR_APPEL_COTONOU",
  INDIVIDUALITY_CERTIFICATE: "COUR_APPEL_COTONOU",
  NON_CONVICTION_CERTIFICATE: "COUR_APPEL_COTONOU",
  NON_BANKRUPTCY_CERTIFICATE: "COUR_APPEL_COTONOU",
  // ANIP
  CIP_ATTESTATION: "ANIP",
  CEDEAO_PASSPORT_ATTESTATION: "ANIP",
  // DGI
  TAX_CERTIFICATE: "DGI",
  IFU_ATTESTATION: "DGI",
  VAT_PAYMENT_CERTIFICATE: "DGI",
  PATENTE_CERTIFICATE: "DGI",
};

export const DOC_VALIDITY_MONTHS: Record<string, number> = {
  BIRTH_CERTIFICATE: 0,
  MARRIAGE_CERTIFICATE: 0,
  DEATH_CERTIFICATE: 0,
  CRIMINAL_RECORD: 3,
  RESIDENCE_CERTIFICATE: 6,
  DOMICILE_CERTIFICATE: 6,
  NATIONALITY_CERTIFICATE: 0,
  TAX_CERTIFICATE: 6,
  IFU_ATTESTATION: 12,
  VAT_PAYMENT_CERTIFICATE: 6,
  PATENTE_CERTIFICATE: 12,
  CIP_ATTESTATION: 12,
  CEDEAO_PASSPORT_ATTESTATION: 12,
  INDIVIDUALITY_CERTIFICATE: 0,
  CELIBACY_CERTIFICATE: 6,
  COLLECTIVE_LIFE_CERTIFICATE: 6,
  NON_CONVICTION_CERTIFICATE: 3,
  NON_BANKRUPTCY_CERTIFICATE: 6,
};

export const DOC_SERIAL_PREFIX: Record<string, string> = {
  BIRTH_CERTIFICATE: "ACN",
  MARRIAGE_CERTIFICATE: "ACM",
  DEATH_CERTIFICATE: "ACD",
  CRIMINAL_RECORD: "CRJ",
  RESIDENCE_CERTIFICATE: "CRS",
  DOMICILE_CERTIFICATE: "CRD",
  NATIONALITY_CERTIFICATE: "CNT",
  TAX_CERTIFICATE: "QFI",
  IFU_ATTESTATION: "IFU",
  VAT_PAYMENT_CERTIFICATE: "TVA",
  PATENTE_CERTIFICATE: "PAT",
  CIP_ATTESTATION: "CIP",
  CEDEAO_PASSPORT_ATTESTATION: "CDE",
  INDIVIDUALITY_CERTIFICATE: "CIN",
  CELIBACY_CERTIFICATE: "CCL",
  COLLECTIVE_LIFE_CERTIFICATE: "CVC",
  NON_CONVICTION_CERTIFICATE: "CNC",
  NON_BANKRUPTCY_CERTIFICATE: "CNF",
};

export const COUNTRY = {
  name: "République du Bénin",
  motto: "Fraternité — Justice — Travail",
  iso: "BEN",
};

// Tarifs en FCFA
export const DOC_PRICING: Record<string, { stamp: number; serviceFee: number }> = {
  BIRTH_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  MARRIAGE_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  DEATH_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  INDIVIDUALITY_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  CELIBACY_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  COLLECTIVE_LIFE_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  CIP_ATTESTATION: { stamp: 200, serviceFee: 50 },
  NATIONALITY_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  CEDEAO_PASSPORT_ATTESTATION: { stamp: 500, serviceFee: 50 },
  CRIMINAL_RECORD: { stamp: 1000, serviceFee: 100 },
  NON_CONVICTION_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  NON_BANKRUPTCY_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  TAX_CERTIFICATE: { stamp: 500, serviceFee: 100 },
  IFU_ATTESTATION: { stamp: 200, serviceFee: 50 },
  VAT_PAYMENT_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  RESIDENCE_CERTIFICATE: { stamp: 200, serviceFee: 50 },
  DOMICILE_CERTIFICATE: { stamp: 200, serviceFee: 50 },
  PATENTE_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
};

export function totalPrice(type: string): number {
  const p = DOC_PRICING[type];
  return p ? p.stamp + p.serviceFee : 0;
}

export const PAYMENT_METHODS = {
  BJ_PAY: {
    label: "BJ Pay (Gouvernement du Bénin)",
    short: "BJ Pay",
    color: "bg-[#008751]",
    needsPhone: true,
    badge: "Officiel",
  },
  MTN_MOMO: {
    label: "MTN Mobile Money",
    short: "MTN MoMo",
    color: "bg-yellow-500",
    needsPhone: true,
  },
  MOOV_MONEY: {
    label: "Moov Money",
    short: "Moov Money",
    color: "bg-blue-600",
    needsPhone: true,
  },
  CELTIIS_CASH: {
    label: "Celtiis Cash",
    short: "Celtiis",
    color: "bg-red-600",
    needsPhone: true,
  },
  CARD: {
    label: "Carte bancaire (Visa / Mastercard)",
    short: "Carte",
    color: "bg-gray-700",
    needsPhone: false,
  },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Payé", color: "bg-emerald-100 text-emerald-800" },
  FAILED: { label: "Échec", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Remboursé", color: "bg-gray-100 text-gray-800" },
};
