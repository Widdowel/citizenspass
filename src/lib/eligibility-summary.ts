import type { CitizenRegistry } from "@/generated/prisma/client";
import { checkEligibility, checkRegistryCompleteness } from "./registry";
import { DOC_TYPES, DOC_AUTHORITY, AUTHORITIES, DOC_VALIDITY_MONTHS, totalPrice } from "./constants";

export type EligibilityStatus = "AVAILABLE" | "RESOLUTION_NEEDED" | "EXTRACTION_NEEDED" | "BLOCKED";

export type CatalogEntry = {
  type: string;
  label: string;
  authority: string;
  authorityShort: string;
  price: number;
  validityMonths: number;
  status: EligibilityStatus;
  reason?: string;
  warnings?: string[];
};

export function computeCatalog(citizen: CitizenRegistry | null): CatalogEntry[] {
  const types = Object.keys(DOC_TYPES);
  return types.map((type) => buildEntry(type, citizen));
}

function buildEntry(type: string, citizen: CitizenRegistry | null): CatalogEntry {
  const authCode = DOC_AUTHORITY[type];
  const auth = AUTHORITIES[authCode];
  const base: Omit<CatalogEntry, "status"> = {
    type,
    label: DOC_TYPES[type],
    authority: auth?.name ?? "—",
    authorityShort: auth?.shortName ?? "—",
    price: totalPrice(type),
    validityMonths: DOC_VALIDITY_MONTHS[type] ?? 0,
  };

  if (!citizen) {
    return { ...base, status: "BLOCKED", reason: "Citoyen introuvable au registre national" };
  }

  // 1. Registre incomplet ?
  const completeness = checkRegistryCompleteness(citizen, type);
  if (!completeness.complete) {
    return {
      ...base,
      status: "EXTRACTION_NEEDED",
      reason: `Acte d'origine pas encore numérisé. Une équipe de la ${completeness.extractionTarget} le numérisera après votre demande.`,
    };
  }

  // 2. Eligibility métier
  const eligibility = checkEligibility(citizen, type);
  if (!eligibility.eligible) {
    // Distingue : régularisation possible (fiscal/judicial) vs blocage définitif
    if (citizen.fiscalStatus === "OVERDUE" && (type === "TAX_CERTIFICATE" || type === "VAT_PAYMENT_CERTIFICATE" || type === "PATENTE_CERTIFICATE")) {
      return {
        ...base,
        status: "RESOLUTION_NEEDED",
        reason: "Régularisation fiscale possible directement dans BJ PASS",
      };
    }
    if (citizen.judicialStatus === "ONGOING" && (type === "CRIMINAL_RECORD" || type === "NON_CONVICTION_CERTIFICATE")) {
      return {
        ...base,
        status: "RESOLUTION_NEEDED",
        reason: "Demande de revue par le greffe possible directement dans BJ PASS",
      };
    }
    return {
      ...base,
      status: "BLOCKED",
      reason: eligibility.exceptionReason,
    };
  }

  return {
    ...base,
    status: "AVAILABLE",
    warnings: eligibility.warnings,
  };
}

export const STATUS_DISPLAY: Record<EligibilityStatus, { label: string; color: string; description: string }> = {
  AVAILABLE: {
    label: "Disponible",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Délivrance automatique en moins de 90 secondes",
  },
  RESOLUTION_NEEDED: {
    label: "Régularisation requise",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Action possible directement dans l'app",
  },
  EXTRACTION_NEEDED: {
    label: "Numérisation requise",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    description: "Délai 2-6h après votre demande",
  },
  BLOCKED: {
    label: "Non disponible",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    description: "Conditions non remplies",
  },
};
