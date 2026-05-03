export const DOC_TYPES: Record<string, string> = {
  BIRTH_CERTIFICATE: "Acte de naissance",
  CRIMINAL_RECORD: "Casier judiciaire (Bulletin n°3)",
  RESIDENCE_CERTIFICATE: "Certificat de résidence",
  NATIONALITY_CERTIFICATE: "Certificat de nationalité",
  TAX_CERTIFICATE: "Quitus fiscal",
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

export type AuthorityCode = "COUR_APPEL_COTONOU" | "MAIRIE_COTONOU" | "DGI";

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
};

export const DOC_AUTHORITY: Record<string, AuthorityCode> = {
  BIRTH_CERTIFICATE: "MAIRIE_COTONOU",
  CRIMINAL_RECORD: "COUR_APPEL_COTONOU",
  RESIDENCE_CERTIFICATE: "MAIRIE_COTONOU",
  NATIONALITY_CERTIFICATE: "COUR_APPEL_COTONOU",
  TAX_CERTIFICATE: "DGI",
};

export const DOC_VALIDITY_MONTHS: Record<string, number> = {
  BIRTH_CERTIFICATE: 0,
  CRIMINAL_RECORD: 3,
  RESIDENCE_CERTIFICATE: 6,
  NATIONALITY_CERTIFICATE: 0,
  TAX_CERTIFICATE: 6,
};

export const DOC_SERIAL_PREFIX: Record<string, string> = {
  BIRTH_CERTIFICATE: "ACN",
  CRIMINAL_RECORD: "CRJ",
  RESIDENCE_CERTIFICATE: "CRS",
  NATIONALITY_CERTIFICATE: "CNT",
  TAX_CERTIFICATE: "QFI",
};

export const COUNTRY = {
  name: "République du Bénin",
  motto: "Fraternité — Justice — Travail",
  iso: "BEN",
};

// Tarifs en FCFA (timbre fiscal officiel + frais de service CitizenPass)
export const DOC_PRICING: Record<string, { stamp: number; serviceFee: number }> = {
  BIRTH_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  CRIMINAL_RECORD: { stamp: 1000, serviceFee: 100 },
  RESIDENCE_CERTIFICATE: { stamp: 200, serviceFee: 50 },
  NATIONALITY_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  TAX_CERTIFICATE: { stamp: 500, serviceFee: 100 },
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
