import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCatalog, STATUS_DISPLAY } from "@/lib/eligibility-summary";
import { DOC_CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  ScanLine,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

const STATUS_ICON = {
  AVAILABLE: CheckCircle2,
  RESOLUTION_NEEDED: AlertTriangle,
  EXTRACTION_NEEDED: ScanLine,
  BLOCKED: Lock,
} as const;

export default async function CatalogPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { registry: true },
  });

  const catalog = computeCatalog(user?.registry ?? null);

  // Compteurs par statut
  const counts = catalog.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Catalogue des services</h1>
        <p className="text-gray-500 mt-1">
          Tous les documents administratifs disponibles, avec votre éligibilité personnelle.
        </p>
      </div>

      {/* Légende des statuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(Object.keys(STATUS_DISPLAY) as Array<keyof typeof STATUS_DISPLAY>).map((s) => {
          const display = STATUS_DISPLAY[s];
          const Icon = STATUS_ICON[s];
          return (
            <div key={s} className={`border rounded-lg p-3 ${display.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">{display.label}</span>
              </div>
              <div className="text-lg font-bold">{counts[s] ?? 0}</div>
              <div className="text-[11px] opacity-75">{display.description}</div>
            </div>
          );
        })}
      </div>

      {/* Catalogue par catégorie */}
      <div className="space-y-8">
        {Object.entries(DOC_CATEGORIES).map(([catKey, cat]) => {
          const items = catalog.filter((e) => cat.types.includes(e.type));
          if (items.length === 0) return null;
          return (
            <div key={catKey}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#008751] mb-3">
                {cat.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((entry) => {
                  const Icon = STATUS_ICON[entry.status];
                  const display = STATUS_DISPLAY[entry.status];

                  const clickable = entry.status === "AVAILABLE" || entry.status === "EXTRACTION_NEEDED";
                  const Wrapper = clickable ? Link : "div";
                  const href =
                    entry.status === "AVAILABLE" || entry.status === "EXTRACTION_NEEDED"
                      ? `/dashboard/request-new?type=${entry.type}`
                      : "#";

                  return (
                    <Wrapper
                      key={entry.type}
                      href={href as string}
                      className={clickable ? "block group" : "block"}
                    >
                      <Card
                        className={`h-full transition-all ${
                          clickable ? "hover:border-[#008751] hover:shadow-md cursor-pointer" : "opacity-75"
                        } ${entry.status === "BLOCKED" ? "border-gray-200" : ""}`}
                      >
                        <CardContent className="pt-5 pb-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${display.color.split(" ").slice(0, 2).join(" ")}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${display.color}`}>
                              {display.label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm mb-1 leading-tight">{entry.label}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{entry.authority}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-[#008751]">
                              {formatXOF(entry.price)}
                            </span>
                            {entry.validityMonths > 0 && (
                              <span className="text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {entry.validityMonths} mois
                              </span>
                            )}
                            {entry.validityMonths === 0 && (
                              <span className="text-gray-400 text-[10px]">Permanent</span>
                            )}
                          </div>

                          {entry.reason && (
                            <p className="mt-3 text-xs text-gray-600 leading-snug border-t border-gray-100 pt-2">
                              {entry.reason}
                            </p>
                          )}

                          {clickable && (
                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end text-xs text-[#008751] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Demander
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Wrapper>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
