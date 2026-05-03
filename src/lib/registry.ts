import { prisma } from "./prisma";
import type { CitizenRegistry } from "@/generated/prisma/client";

export type EligibilityCheck = {
  eligible: boolean;
  exceptionReason?: string;
  warnings?: string[];
  needsExtraction?: boolean;
  extractionTarget?: string;
};

const REQUIRED_FIELDS_BY_TYPE: Record<string, (keyof CitizenRegistry)[]> = {
  BIRTH_CERTIFICATE: ["firstName", "lastName", "birthDate", "birthPlace", "birthCommune", "fatherName", "motherName"],
  CRIMINAL_RECORD: ["firstName", "lastName", "birthDate", "birthPlace"],
  RESIDENCE_CERTIFICATE: ["firstName", "lastName", "address", "commune", "department"],
  NATIONALITY_CERTIFICATE: ["firstName", "lastName", "birthDate", "birthPlace", "birthCommune"],
  TAX_CERTIFICATE: ["firstName", "lastName", "birthDate"],
};

export function checkRegistryCompleteness(
  citizen: CitizenRegistry,
  documentType: string,
): { complete: boolean; missingFields: string[]; extractionTarget: string } {
  const required = REQUIRED_FIELDS_BY_TYPE[documentType] ?? [];
  const missing: string[] = [];
  for (const f of required) {
    const v = citizen[f];
    if (v === null || v === undefined || v === "") missing.push(f as string);
  }

  let extractionTarget = "Mairie de Cotonou";
  if (documentType === "CRIMINAL_RECORD" || documentType === "NATIONALITY_CERTIFICATE") {
    extractionTarget = "Cour d'Appel de Cotonou";
  } else if (citizen.birthCommune) {
    extractionTarget = `Mairie de ${citizen.birthCommune}`;
  }

  return { complete: missing.length === 0, missingFields: missing, extractionTarget };
}

export async function lookupByCip(cip: string): Promise<CitizenRegistry | null> {
  return prisma.citizenRegistry.findUnique({ where: { cip } });
}

export async function lookupByUserId(userId: string): Promise<CitizenRegistry | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { registry: true },
  });
  return user?.registry ?? null;
}

export function checkEligibility(
  citizen: CitizenRegistry,
  documentType: string,
): EligibilityCheck {
  switch (documentType) {
    // ===== ÉTAT CIVIL =====
    case "BIRTH_CERTIFICATE":
    case "INDIVIDUALITY_CERTIFICATE":
    case "COLLECTIVE_LIFE_CERTIFICATE":
      return { eligible: true };

    case "MARRIAGE_CERTIFICATE":
      if (citizen.maritalStatus !== "MARRIED" && citizen.maritalStatus !== "DIVORCED" && citizen.maritalStatus !== "WIDOWED") {
        return {
          eligible: false,
          exceptionReason: "Aucun mariage enregistré pour ce citoyen.",
        };
      }
      return { eligible: true };

    case "DEATH_CERTIFICATE":
      // Cas particulier : à demander par un proche, ici simplifié
      return { eligible: true };

    case "CELIBACY_CERTIFICATE":
      if (citizen.maritalStatus === "MARRIED") {
        return {
          eligible: false,
          exceptionReason: "Citoyen enregistré comme marié. Certificat de célibat non délivrable.",
        };
      }
      return { eligible: true };

    // ===== IDENTITÉ =====
    case "CIP_ATTESTATION":
    case "CIP_RENEWAL":
    case "FID_CARD":
    case "CEDEAO_PASSPORT_ATTESTATION":
      return { eligible: true };

    case "PASSPORT_ORDINARY":
      // Le passeport ordinaire requiert que le citoyen soit Béninois
      if (citizen.nationality !== "Béninoise") {
        return {
          eligible: false,
          exceptionReason: "Passeport ordinaire réservé aux ressortissants béninois.",
        };
      }
      return { eligible: true };

    case "NATIONALITY_CERTIFICATE":
      if (citizen.nationality !== "Béninoise") {
        return {
          eligible: false,
          exceptionReason: `Nationalité enregistrée: ${citizen.nationality}. Document non délivrable.`,
        };
      }
      return { eligible: true };

    // ===== JUDICIAIRE =====
    case "CRIMINAL_RECORD":
    case "NON_CONVICTION_CERTIFICATE":
      if (citizen.judicialStatus === "ONGOING") {
        return {
          eligible: false,
          exceptionReason:
            "Une procédure judiciaire est en cours. Une revue par le greffe de la Cour d'Appel est requise.",
        };
      }
      if (citizen.judicialStatus === "CONVICTED") {
        return {
          eligible: false,
          exceptionReason:
            "Une condamnation est inscrite au casier. Document non délivrable.",
        };
      }
      return { eligible: true };

    case "NON_BANKRUPTCY_CERTIFICATE":
      // Vérification commerce : réutilise judicialStatus en démo
      return { eligible: true };

    // ===== FISCAL =====
    case "TAX_CERTIFICATE":
      if (citizen.fiscalStatus === "OVERDUE") {
        return {
          eligible: false,
          exceptionReason:
            "Situation fiscale non régularisée. Le quitus ne peut être délivré.",
        };
      }
      if (citizen.fiscalStatus === "PENDING") {
        return {
          eligible: true,
          warnings: ["Régularisation fiscale en cours — quitus délivré sous réserve."],
        };
      }
      return { eligible: true };

    case "IFU_ATTESTATION":
      return { eligible: true };

    case "VAT_PAYMENT_CERTIFICATE":
      if (citizen.fiscalStatus === "OVERDUE") {
        return {
          eligible: false,
          exceptionReason: "Paiement TVA en retard. Régularisation requise.",
        };
      }
      return { eligible: true };

    case "PATENTE_CERTIFICATE":
      if (citizen.fiscalStatus === "OVERDUE") {
        return {
          eligible: false,
          exceptionReason: "Patente non à jour. Régularisation requise.",
        };
      }
      return { eligible: true };

    // ===== COMMERCE (RCCM) =====
    case "RCCM_REGISTRATION":
    case "RCCM_EXTRACT":
      return { eligible: true };

    // ===== TRANSPORTS =====
    case "DRIVER_LICENSE_NEW":
    case "DRIVER_LICENSE_INTERNATIONAL":
      // Le permis nécessite d'être majeur (date de naissance > 18 ans)
      if (citizen.birthDate) {
        const ageYears = (Date.now() - citizen.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (ageYears < 18) {
          return {
            eligible: false,
            exceptionReason: "Le citoyen doit être majeur pour le permis de conduire.",
          };
        }
      }
      return { eligible: true };

    // ===== ÉDUCATION =====
    case "BEPC_CERTIFICATE":
    case "BAC_DIPLOMA":
    case "BAC_RECORD_EXTRACT":
    case "BAC_AUTHENTICITY":
      // En production : vérification auprès de la base MESTP. En démo : on délivre.
      return { eligible: true };

    // ===== MUNICIPAL =====
    case "RESIDENCE_CERTIFICATE":
    case "DOMICILE_CERTIFICATE":
      if (!citizen.address || !citizen.commune) {
        return {
          eligible: false,
          exceptionReason:
            "Aucune adresse de résidence enregistrée au registre. Mise à jour ANIP requise.",
        };
      }
      return { eligible: true };

    default:
      return { eligible: false, exceptionReason: `Type de document non supporté: ${documentType}` };
  }
}

export type ExtractedData = {
  fullName: string;
  birthDate: string;
  birthPlace: string;
  birthCommune: string;
  birthDepartment: string;
  gender: string;
  nationality: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus: string;
  spouseName?: string;
  address?: string;
  commune?: string;
  department?: string;
  cip: string;
  judicialStatus?: string;
  fiscalStatus?: string;
};

export function extractDataForDocument(
  citizen: CitizenRegistry,
  documentType: string,
): ExtractedData {
  const fullName = [citizen.firstName, citizen.middleName, citizen.lastName]
    .filter(Boolean)
    .join(" ");

  const base: ExtractedData = {
    fullName,
    birthDate: citizen.birthDate ? citizen.birthDate.toISOString().split("T")[0] : "",
    birthPlace: citizen.birthPlace ?? "",
    birthCommune: citizen.birthCommune ?? "",
    birthDepartment: citizen.birthDepartment ?? "",
    gender: citizen.gender,
    nationality: citizen.nationality,
    fatherName: citizen.fatherName ?? undefined,
    motherName: citizen.motherName ?? undefined,
    maritalStatus: citizen.maritalStatus,
    spouseName: citizen.spouseName ?? undefined,
    address: citizen.address ?? undefined,
    commune: citizen.commune ?? undefined,
    department: citizen.department ?? undefined,
    cip: citizen.cip,
  };

  if (documentType === "CRIMINAL_RECORD") {
    base.judicialStatus = citizen.judicialStatus;
  }
  if (documentType === "TAX_CERTIFICATE") {
    base.fiscalStatus = citizen.fiscalStatus;
  }

  return base;
}
