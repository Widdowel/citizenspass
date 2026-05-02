export const DOC_TYPES: Record<string, string> = {
  BIRTH_CERTIFICATE: "Acte de naissance",
  CRIMINAL_RECORD: "Casier judiciaire",
  RESIDENCE_CERTIFICATE: "Certificat de résidence",
  NATIONALITY_CERTIFICATE: "Certificat de nationalité",
  MARRIAGE_CERTIFICATE: "Acte de mariage",
  DEATH_CERTIFICATE: "Acte de décès",
  DRIVER_LICENSE: "Permis de conduire",
  TAX_CERTIFICATE: "Attestation fiscale",
};

export const REQUEST_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "En traitement", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "Approuvé", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejeté", color: "bg-red-100 text-red-800" },
  READY: { label: "Prêt", color: "bg-emerald-100 text-emerald-800" },
};
