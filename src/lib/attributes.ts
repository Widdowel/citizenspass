import type { CitizenRegistry } from "@/generated/prisma/client";

// Catalogue des attributs vérifiables sans révéler le document source.
// Chaque attribut peut être un booléen, une valeur agrégée, ou une plage.

export type AttributeKey =
  | "isAdult"
  | "ageBracket"
  | "isBeninCitizen"
  | "hasCleanCriminalRecord"
  | "isFiscallyCompliant"
  | "residesInCommune"
  | "residesInDepartment"
  | "isMarried"
  | "gender"
  | "fullName";

export const ATTRIBUTE_LABELS: Record<AttributeKey, { label: string; sensitivity: "low" | "medium" | "high" }> = {
  isAdult: { label: "Est majeur(e) (≥ 18 ans)", sensitivity: "low" },
  ageBracket: { label: "Tranche d'âge (5 ans)", sensitivity: "low" },
  isBeninCitizen: { label: "Nationalité béninoise", sensitivity: "low" },
  hasCleanCriminalRecord: { label: "Casier judiciaire vierge", sensitivity: "high" },
  isFiscallyCompliant: { label: "À jour fiscalement", sensitivity: "medium" },
  residesInCommune: { label: "Réside dans la commune (paramètre)", sensitivity: "medium" },
  residesInDepartment: { label: "Réside dans le département", sensitivity: "low" },
  isMarried: { label: "Marié(e)", sensitivity: "medium" },
  gender: { label: "Genre", sensitivity: "low" },
  fullName: { label: "Nom & prénoms complets", sensitivity: "high" },
};

export type ResolvedAttribute =
  | { key: AttributeKey; value: boolean | string; available: true }
  | { key: AttributeKey; available: false; reason: string };

function ageBracketFor(years: number): string {
  if (years < 18) return "<18";
  if (years < 25) return "18-24";
  if (years < 35) return "25-34";
  if (years < 45) return "35-44";
  if (years < 55) return "45-54";
  if (years < 65) return "55-64";
  return "65+";
}

function ageInYears(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export function resolveAttributes(
  citizen: CitizenRegistry,
  keys: AttributeKey[],
  params: { commune?: string } = {},
): ResolvedAttribute[] {
  const result: ResolvedAttribute[] = [];
  for (const key of keys) {
    switch (key) {
      case "isAdult":
        if (!citizen.birthDate) {
          result.push({ key, available: false, reason: "Date de naissance non disponible au registre" });
          break;
        }
        result.push({ key, value: ageInYears(citizen.birthDate) >= 18, available: true });
        break;

      case "ageBracket":
        if (!citizen.birthDate) {
          result.push({ key, available: false, reason: "Date de naissance non disponible au registre" });
          break;
        }
        result.push({ key, value: ageBracketFor(ageInYears(citizen.birthDate)), available: true });
        break;

      case "isBeninCitizen":
        result.push({ key, value: citizen.nationality === "Béninoise", available: true });
        break;

      case "hasCleanCriminalRecord":
        result.push({ key, value: citizen.judicialStatus === "CLEAN", available: true });
        break;

      case "isFiscallyCompliant":
        result.push({ key, value: citizen.fiscalStatus === "UP_TO_DATE", available: true });
        break;

      case "residesInCommune":
        if (!params.commune) {
          result.push({ key, available: false, reason: "Paramètre 'commune' manquant" });
          break;
        }
        result.push({
          key,
          value: (citizen.commune ?? "").toLowerCase() === params.commune.toLowerCase(),
          available: true,
        });
        break;

      case "residesInDepartment":
        result.push({
          key,
          value: citizen.department ?? "—",
          available: !!citizen.department,
          ...(!citizen.department ? { reason: "Département non renseigné au registre" } : {}),
        } as ResolvedAttribute);
        break;

      case "isMarried":
        result.push({ key, value: citizen.maritalStatus === "MARRIED", available: true });
        break;

      case "gender":
        result.push({ key, value: citizen.gender === "F" ? "F" : "M", available: true });
        break;

      case "fullName": {
        const fullName = [citizen.firstName, citizen.middleName, citizen.lastName]
          .filter(Boolean)
          .join(" ");
        result.push({ key, value: fullName, available: true });
        break;
      }

      default:
        result.push({ key, available: false, reason: "Attribut inconnu" });
    }
  }
  return result;
}
