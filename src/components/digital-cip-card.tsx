import QRCode from "qrcode";
import { ShieldCheck } from "lucide-react";
import type { CitizenRegistry } from "@/generated/prisma/client";

type Props = {
  registry: CitizenRegistry;
  cip: string;
};

function frenchDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function genderLabel(g: string) {
  return g === "F" ? "Féminin" : "Masculin";
}

function maritalLabel(s: string): string {
  switch (s) {
    case "MARRIED":
      return "Marié(e)";
    case "DIVORCED":
      return "Divorcé(e)";
    case "WIDOWED":
      return "Veuf / Veuve";
    default:
      return "Célibataire";
  }
}

// Server component — génère le QR data-url côté serveur
export default async function DigitalCipCard({ registry, cip }: Props) {
  const fullName = [registry.firstName, registry.middleName, registry.lastName]
    .filter(Boolean)
    .join(" ");

  const qrData = `CIP:${cip};NAME:${fullName};DOB:${registry.birthDate?.toISOString().split("T")[0] ?? ""}`;
  const qrDataUrl = await QRCode.toDataURL(qrData, {
    margin: 0,
    width: 100,
    color: { dark: "#000000", light: "#ffffff" },
  });

  // Initiales pour avatar (en cas d'absence de photo)
  const initials = (registry.firstName.charAt(0) + registry.lastName.charAt(0)).toUpperCase();

  return (
    <div className="relative bg-gradient-to-br from-[#008751] via-[#006b41] to-[#1E3A5F] rounded-2xl p-5 text-white shadow-xl overflow-hidden">
      {/* Drapeau du Bénin en bordure verticale gauche (vert pleine hauteur) puis en haut-droite (jaune/rouge) */}
      <div className="absolute top-0 left-0 w-3 h-full bg-[#008751] border-r border-white/10" />
      <div className="absolute top-0 right-0 w-1.5 h-1/2 bg-[#FCD116]" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1/2 bg-[#E11829]" />

      {/* Bande horizontale tricolore en bas */}
      <div className="absolute bottom-0 left-3 right-1.5 h-1 flex">
        <div className="flex-1 bg-[#008751]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#E11829]" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">
            République du Bénin
          </div>
          <div className="text-xs font-bold mt-0.5">Carte d&apos;Identité Personnelle</div>
          <div className="text-[10px] text-white/60">ANIP — Identifiant National</div>
        </div>
        <ShieldCheck className="w-6 h-6 text-[#FCD116]" />
      </div>

      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className="w-20 h-24 rounded-md bg-white/10 backdrop-blur border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
          {registry.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={registry.photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{initials}</span>
          )}
        </div>

        {/* Données */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase text-white/60 mb-0.5">Nom & prénoms</div>
          <div className="font-bold text-base leading-tight truncate">{fullName}</div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
            <div>
              <div className="text-[9px] uppercase text-white/60">CIP</div>
              <div className="font-mono text-xs font-bold">{cip}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/60">Sexe</div>
              <div className="text-xs">{genderLabel(registry.gender)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/60">Né(e) le</div>
              <div className="text-xs">
                {registry.birthDate ? frenchDate(registry.birthDate) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/60">Nationalité</div>
              <div className="text-xs">{registry.nationality}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[9px] uppercase text-white/60">Lieu de naissance</div>
              <div className="text-xs truncate">
                {registry.birthCommune ?? "—"}, {registry.birthDepartment ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* QR */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR" className="w-20 h-20 rounded bg-white p-1.5 shrink-0" />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-white/70">
        <span>Émise par ANIP — République du Bénin</span>
        <span className="font-mono">État : {maritalLabel(registry.maritalStatus)}</span>
      </div>

      {/* Watermark décoratif */}
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#FCD116]/10 pointer-events-none" />
    </div>
  );
}
