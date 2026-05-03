import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/attributes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  PENDING: { label: "À traiter", color: "bg-yellow-100 text-yellow-800" },
  AUTHORIZED: { label: "Autorisée", color: "bg-emerald-100 text-emerald-700" },
  DENIED: { label: "Refusée", color: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Expirée", color: "bg-gray-100 text-gray-600" },
};

export default async function VerificationsListPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;

  const items = await prisma.verificationRequest.findMany({
    where: { citizenId: userId },
    orderBy: { createdAt: "desc" },
    include: { verifier: true },
  });

  const pending = items.filter((i) => i.status === "PENDING" && i.expiresAt > new Date());
  const past = items.filter((i) => !pending.includes(i));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-[#008751]" />
          Demandes de vérification
        </h1>
        <p className="text-gray-500 mt-1">
          Institutions qui souhaitent vérifier des informations vous concernant. Vous gardez le contrôle.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900 flex items-start gap-2">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong>Vous gardez la main.</strong> Quand une banque, un employeur ou une administration veut
          vérifier votre nationalité, votre casier ou votre situation fiscale, ils ne reçoivent pas vos
          documents : ils reçoivent uniquement les <em>réponses</em> aux questions précises que vous autorisez.
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">À traiter ({pending.length})</h2>
      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-400 text-sm">
            Aucune demande en attente. Tout est calme.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((v) => {
            const keys = JSON.parse(v.attributesAsked) as AttributeKey[];
            return (
              <Card key={v.id} className="border-yellow-200">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-yellow-700" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{v.verifier.name}</div>
                      <div className="text-xs text-gray-500">
                        {v.verifier.category} —{" "}
                        {new Date(v.createdAt).toLocaleString("fr-FR")}
                      </div>
                      {v.purpose && <p className="text-sm text-gray-600 mt-1">{v.purpose}</p>}
                    </div>
                    <Badge className={STATUS_BADGE.PENDING.color}>{STATUS_BADGE.PENDING.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {keys.map((k) => (
                      <Badge key={k} variant="secondary" className="text-xs">
                        {ATTRIBUTE_LABELS[k]?.label ?? k}
                      </Badge>
                    ))}
                  </div>
                  <Link href={`/dashboard/verifications/${v.id}`}>
                    <Button className="bg-[#008751] hover:bg-[#006b41]">
                      Examiner et décider
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3 mt-8">Historique</h2>
      {past.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-gray-400 text-sm">
            Pas d&apos;historique pour l&apos;instant.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {past.map((v) => {
            const status = STATUS_BADGE[v.status === "PENDING" ? "EXPIRED" : v.status];
            return (
              <Card key={v.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{v.verifier.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(v.createdAt).toLocaleString("fr-FR")}
                      </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
