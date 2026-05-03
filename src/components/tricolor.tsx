import { ShieldCheck } from "lucide-react";

// Couleurs officielles du drapeau béninois
export const BENIN_COLORS = {
  green: "#008751",
  yellow: "#FCD116",
  red: "#E11829",
};

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  withIcon?: boolean;
  className?: string;
};

const SIZES = {
  sm: { box: "w-7 h-7", icon: "w-4 h-4" },
  md: { box: "w-9 h-9", icon: "w-5 h-5" },
  lg: { box: "w-12 h-12", icon: "w-6 h-6" },
  xl: { box: "w-16 h-16", icon: "w-9 h-9" },
};

// Logo tricolore — drapeau du Bénin stylisé en carré
// Vert à gauche (1/3), jaune en haut à droite (1/2 du 2/3 droit), rouge en bas
export function TricolorLogo({ size = "md", withIcon = true, className = "" }: LogoProps) {
  const s = SIZES[size];
  return (
    <div className={`${s.box} rounded-lg overflow-hidden flex items-stretch shadow-sm ${className}`}>
      {/* Bande verticale verte (1/3) */}
      <div className="w-1/3 bg-[#008751] flex items-center justify-center">
        {withIcon && <ShieldCheck className={`${s.icon} text-white`} />}
      </div>
      {/* Partie droite : jaune en haut, rouge en bas */}
      <div className="w-2/3 flex flex-col">
        <div className="h-1/2 bg-[#FCD116]" />
        <div className="h-1/2 bg-[#E11829]" />
      </div>
    </div>
  );
}

// Bande tricolore horizontale (3 bandes verticales étroites façon sceau)
// À placer en haut d'une page comme signature visuelle
export function TricolorBar({
  variant = "vertical",
  thickness = "thin",
}: {
  variant?: "vertical" | "horizontal";
  thickness?: "thin" | "thick";
}) {
  const h = thickness === "thin" ? "h-1" : "h-1.5";
  if (variant === "horizontal") {
    // 3 bandes horizontales empilées (drapeau en miniature)
    return (
      <div className="flex flex-col w-full">
        <div className={`${h} bg-[#008751]`} />
        <div className={`${h} bg-[#FCD116]`} />
        <div className={`${h} bg-[#E11829]`} />
      </div>
    );
  }
  // 3 bandes verticales (signature en bordure)
  return (
    <div className={`${h} flex w-full`}>
      <div className="flex-1 bg-[#008751]" />
      <div className="flex-1 bg-[#FCD116]" />
      <div className="flex-1 bg-[#E11829]" />
    </div>
  );
}

// Décoration : bandes verticales étroites à utiliser sur le bord d'un élément
export function TricolorEdge({ side = "left" }: { side?: "left" | "right" }) {
  const pos = side === "left" ? "left-0" : "right-0";
  return (
    <div className={`absolute top-0 ${pos} h-full flex flex-col`}>
      <div className="w-1.5 flex-1 bg-[#008751]" />
      <div className="w-1.5 flex-1 bg-[#FCD116]" />
      <div className="w-1.5 flex-1 bg-[#E11829]" />
    </div>
  );
}
