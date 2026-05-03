export const DOC_TYPES: Record<string, string> = {
  // État civil
  BIRTH_CERTIFICATE: "Acte de naissance sécurisé",
  MARRIAGE_CERTIFICATE: "Acte de mariage",
  DEATH_CERTIFICATE: "Acte de décès",
  INDIVIDUALITY_CERTIFICATE: "Certificat d'individualité",
  CELIBACY_CERTIFICATE: "Certificat de célibat et coutumes",
  COLLECTIVE_LIFE_CERTIFICATE: "Certificat de vie collective",
  // Identité & nationalité
  CIP_ATTESTATION: "Attestation CIP (ANIP)",
  CIP_RENEWAL: "Renouvellement de la carte CIP",
  FID_CARD: "Carte FID (Fichier d'Identification Digitale)",
  NATIONALITY_CERTIFICATE: "Certificat de nationalité",
  CEDEAO_PASSPORT_ATTESTATION: "Attestation de passeport CEDEAO",
  PASSPORT_ORDINARY: "Passeport ordinaire biométrique",
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
  // Professionnel & Commerce
  PATENTE_CERTIFICATE: "Quitus patente",
  RCCM_REGISTRATION: "Immatriculation au registre du commerce",
  RCCM_EXTRACT: "Extrait du registre du commerce (RCCM)",
  // Transports
  DRIVER_LICENSE_NEW: "Permis de conduire biométrique",
  DRIVER_LICENSE_INTERNATIONAL: "Permis de conduire international",
  // Éducation
  BEPC_CERTIFICATE: "Certificat du BEPC",
  BAC_DIPLOMA: "Diplôme du baccalauréat",
  BAC_RECORD_EXTRACT: "Extrait du relevé du baccalauréat",
  BAC_AUTHENTICITY: "Authenticité du diplôme du baccalauréat",
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
    types: [
      "CIP_ATTESTATION",
      "CIP_RENEWAL",
      "FID_CARD",
      "NATIONALITY_CERTIFICATE",
      "CEDEAO_PASSPORT_ATTESTATION",
      "PASSPORT_ORDINARY",
    ],
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
  COMMERCE: {
    label: "Commerce et professionnel",
    types: ["PATENTE_CERTIFICATE", "RCCM_REGISTRATION", "RCCM_EXTRACT"],
  },
  TRANSPORT: {
    label: "Transports",
    types: ["DRIVER_LICENSE_NEW", "DRIVER_LICENSE_INTERNATIONAL"],
  },
  EDUCATION: {
    label: "Éducation",
    types: ["BEPC_CERTIFICATE", "BAC_DIPLOMA", "BAC_RECORD_EXTRACT", "BAC_AUTHENTICITY"],
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

export type AuthorityCode =
  | "COUR_APPEL_COTONOU"
  | "MAIRIE_COTONOU"
  | "DGI"
  | "ANIP"
  | "ANATT"
  | "DEPLA"
  | "RCCM"
  | "MIN_EDUCATION";

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
  ANATT: {
    name: "Agence Nationale des Transports Terrestres",
    shortName: "ANaTT",
    subtitle: "Ministère des Infrastructures et Transports",
  },
  DEPLA: {
    name: "Direction de l'Émigration et de l'Immigration",
    shortName: "DEI",
    subtitle: "Ministère de l'Intérieur et de la Sécurité Publique",
  },
  RCCM: {
    name: "Registre du Commerce et du Crédit Mobilier",
    shortName: "RCCM",
    subtitle: "Greffe du Tribunal de Commerce",
  },
  MIN_EDUCATION: {
    name: "Ministère des Enseignements Secondaire, Technique et Professionnel",
    shortName: "MESTP",
    subtitle: "Direction des Examens et Concours",
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
  CIP_RENEWAL: "ANIP",
  FID_CARD: "ANIP",
  CEDEAO_PASSPORT_ATTESTATION: "ANIP",
  // DEPLA (passeport)
  PASSPORT_ORDINARY: "DEPLA",
  // DGI
  TAX_CERTIFICATE: "DGI",
  IFU_ATTESTATION: "DGI",
  VAT_PAYMENT_CERTIFICATE: "DGI",
  PATENTE_CERTIFICATE: "DGI",
  // RCCM
  RCCM_REGISTRATION: "RCCM",
  RCCM_EXTRACT: "RCCM",
  // DTT
  DRIVER_LICENSE_NEW: "ANATT",
  DRIVER_LICENSE_INTERNATIONAL: "ANATT",
  // Ministère Éducation
  BEPC_CERTIFICATE: "MIN_EDUCATION",
  BAC_DIPLOMA: "MIN_EDUCATION",
  BAC_RECORD_EXTRACT: "MIN_EDUCATION",
  BAC_AUTHENTICITY: "MIN_EDUCATION",
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
  CIP_RENEWAL: 0,
  FID_CARD: 60, // 5 ans
  CEDEAO_PASSPORT_ATTESTATION: 12,
  PASSPORT_ORDINARY: 60,
  INDIVIDUALITY_CERTIFICATE: 0,
  CELIBACY_CERTIFICATE: 6,
  COLLECTIVE_LIFE_CERTIFICATE: 6,
  NON_CONVICTION_CERTIFICATE: 3,
  NON_BANKRUPTCY_CERTIFICATE: 6,
  RCCM_REGISTRATION: 0,
  RCCM_EXTRACT: 6,
  DRIVER_LICENSE_NEW: 60,
  DRIVER_LICENSE_INTERNATIONAL: 12,
  BEPC_CERTIFICATE: 0,
  BAC_DIPLOMA: 0,
  BAC_RECORD_EXTRACT: 12,
  BAC_AUTHENTICITY: 12,
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
  CIP_RENEWAL: "CIR",
  FID_CARD: "FID",
  CEDEAO_PASSPORT_ATTESTATION: "CDE",
  PASSPORT_ORDINARY: "PSP",
  INDIVIDUALITY_CERTIFICATE: "CIN",
  CELIBACY_CERTIFICATE: "CCL",
  COLLECTIVE_LIFE_CERTIFICATE: "CVC",
  NON_CONVICTION_CERTIFICATE: "CNC",
  NON_BANKRUPTCY_CERTIFICATE: "CNF",
  RCCM_REGISTRATION: "RCM",
  RCCM_EXTRACT: "RCE",
  DRIVER_LICENSE_NEW: "PCB",
  DRIVER_LICENSE_INTERNATIONAL: "PCI",
  BEPC_CERTIFICATE: "BEP",
  BAC_DIPLOMA: "BAC",
  BAC_RECORD_EXTRACT: "BAR",
  BAC_AUTHENTICITY: "BAA",
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
  CIP_RENEWAL: { stamp: 1000, serviceFee: 100 },
  FID_CARD: { stamp: 1000, serviceFee: 100 },
  NATIONALITY_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  CEDEAO_PASSPORT_ATTESTATION: { stamp: 500, serviceFee: 50 },
  PASSPORT_ORDINARY: { stamp: 50000, serviceFee: 500 },
  CRIMINAL_RECORD: { stamp: 1000, serviceFee: 100 },
  NON_CONVICTION_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  NON_BANKRUPTCY_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  TAX_CERTIFICATE: { stamp: 500, serviceFee: 100 },
  IFU_ATTESTATION: { stamp: 200, serviceFee: 50 },
  VAT_PAYMENT_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  RESIDENCE_CERTIFICATE: { stamp: 200, serviceFee: 50 },
  DOMICILE_CERTIFICATE: { stamp: 200, serviceFee: 50 },
  PATENTE_CERTIFICATE: { stamp: 1000, serviceFee: 100 },
  RCCM_REGISTRATION: { stamp: 10000, serviceFee: 500 },
  RCCM_EXTRACT: { stamp: 1500, serviceFee: 100 },
  DRIVER_LICENSE_NEW: { stamp: 17000, serviceFee: 300 },
  DRIVER_LICENSE_INTERNATIONAL: { stamp: 5000, serviceFee: 200 },
  BEPC_CERTIFICATE: { stamp: 500, serviceFee: 50 },
  BAC_DIPLOMA: { stamp: 1000, serviceFee: 100 },
  BAC_RECORD_EXTRACT: { stamp: 500, serviceFee: 50 },
  BAC_AUTHENTICITY: { stamp: 500, serviceFee: 100 },
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
