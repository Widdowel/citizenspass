import { prisma } from "./prisma";
import type { CitizenRegistry } from "@/generated/prisma/client";

export type EligibilityCheck = {
  eligible: boolean;
  exceptionReason?: string;
  warnings?: string[];
};

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
    case "BIRTH_CERTIFICATE":
      // Toujours éligible si le citoyen est dans le registre
      return { eligible: true };

    case "CRIMINAL_RECORD":
      if (citizen.judicialStatus === "ONGOING") {
        return {
          eligible: false,
          exceptionReason:
            "Une procédure judiciaire est en cours. Le bulletin n°3 ne peut être délivré automatiquement. Une revue par le greffe de la Cour d'Appel est requise.",
        };
      }
      return { eligible: true };

    case "RESIDENCE_CERTIFICATE":
      if (!citizen.address || !citizen.commune) {
        return {
          eligible: false,
          exceptionReason:
            "Aucune adresse de résidence enregistrée au registre. Mise à jour ANIP requise.",
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

    case "TAX_CERTIFICATE":
      if (citizen.fiscalStatus === "OVERDUE") {
        return {
          eligible: false,
          exceptionReason:
            "Situation fiscale non régularisée. Le quitus ne peut être délivré. Contactez la DGI.",
        };
      }
      if (citizen.fiscalStatus === "PENDING") {
        return {
          eligible: true,
          warnings: ["Régularisation fiscale en cours — quitus délivré sous réserve."],
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
    birthDate: citizen.birthDate.toISOString().split("T")[0],
    birthPlace: citizen.birthPlace,
    birthCommune: citizen.birthCommune,
    birthDepartment: citizen.birthDepartment,
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
