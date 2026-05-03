import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES, REQUEST_STATUS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RequestsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;

  const requests = await prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { document: true, resolution: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-gray-500 mt-1">Suivez l&apos;etat de vos demandes</p>
        </div>
        <Link href="/dashboard/request-new">
          <Button className="bg-[#008751] hover:bg-[#006b41]">
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucune demande
            </h3>
            <p className="text-gray-400 mb-6">
              Vous n&apos;avez pas encore fait de demande de document.
            </p>
            <Link href="/dashboard/request-new">
              <Button className="bg-[#008751] hover:bg-[#006b41]">
                Faire une demande
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const status = REQUEST_STATUS[req.status] || {
              label: req.status,
              color: "bg-gray-100 text-gray-800",
            };
            return (
              <Card key={req.id} className={req.resolution && req.resolution.status === "PENDING_PAYMENT" ? "border-orange-200" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {DOC_TYPES[req.type] || req.type}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Soumise le{" "}
                        {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        {req.reason && ` — ${req.reason}`}
                      </p>
                      {req.exceptionReason && (
                        <p className="text-sm text-orange-600 mt-1">
                          {req.exceptionReason}
                        </p>
                      )}
                      {req.note && (
                        <p className="text-sm text-blue-600 mt-1">
                          Note : {req.note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={status.color}>{status.label}</Badge>
                      {req.document && (
                        <Link
                          href={`/api/documents/${req.document.id}/file`}
                          target="_blank"
                          className="text-xs text-[#008751] hover:underline"
                        >
                          Télécharger le PDF →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Bandeau de résolution si action requise */}
                  {req.resolution && req.resolution.status === "PENDING_PAYMENT" && (
                    <Link href={`/dashboard/resolutions/${req.resolution.id}`}>
                      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3 hover:bg-orange-100 transition-colors cursor-pointer">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                        <div className="flex-1 text-sm">
                          <div className="font-semibold text-orange-900">
                            Action requise — régularisation possible dans l&apos;app
                          </div>
                          <div className="text-orange-700 text-xs">
                            {req.resolution.type === "FISCAL_DEBT"
                              ? "Payez votre dette fiscale dans BJ PASS — quitus généré immédiatement."
                              : "Demandez une revue accélérée par le greffe — sans déplacement."}
                          </div>
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Régulariser
                          <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                      </div>
                    </Link>
                  )}

                  {req.resolution && req.resolution.status === "PENDING_REVIEW" && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-900">
                        En attente de validation du greffe (quelques heures)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
