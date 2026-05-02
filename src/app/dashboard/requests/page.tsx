import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES, REQUEST_STATUS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RequestsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;

  const requests = await prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
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
              <Card key={req.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {DOC_TYPES[req.type] || req.type}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Soumise le{" "}
                        {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                        {req.reason && ` — ${req.reason}`}
                      </p>
                      {req.note && (
                        <p className="text-sm text-blue-600 mt-1">
                          Note : {req.note}
                        </p>
                      )}
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
