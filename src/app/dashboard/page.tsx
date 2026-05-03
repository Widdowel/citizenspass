import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle2, AlertCircle, Grid3x3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DigitalCipCard from "@/components/digital-cip-card";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id: string })?.id;

  const [user, docCount, pendingCount, readyCount, totalRequests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { registry: true } }),
    prisma.document.count({ where: { userId } }),
    prisma.request.count({ where: { userId, status: { in: ["PENDING", "VERIFYING", "CHECKING", "GENERATING", "SIGNING", "AWAITING_PAYMENT"] } } }),
    prisma.request.count({ where: { userId, status: "READY" } }),
    prisma.request.count({ where: { userId } }),
  ]);

  const stats = [
    {
      label: "Documents disponibles",
      value: docCount,
      icon: FileText,
      color: "text-[#008751]",
      bg: "bg-[#008751]/10",
    },
    {
      label: "Demandes en cours",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Prêts à télécharger",
      value: readyCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total demandes",
      value: totalRequests,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const userName = user?.name || "Citoyen";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {userName.split(" ")[0]} !
        </h1>
        <p className="text-gray-500 mt-1">
          Votre identité numérique et vos documents officiels.
        </p>
      </div>

      {/* CIP NUMÉRIQUE */}
      {user?.registry && (
        <div className="mb-8 max-w-2xl">
          <DigitalCipCard registry={user.registry} cip={user.cip} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Présentez ce QR à toute administration ou tiers autorisé pour vérifier votre identité.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/catalog" className="block">
              <Button className="w-full bg-[#008751] hover:bg-[#006b41]">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Catalogue des services
              </Button>
            </Link>
            <Link href="/dashboard/documents" className="block">
              <Button variant="outline" className="w-full">
                Voir mes documents
              </Button>
            </Link>
            <Link href="/dashboard/requests" className="block">
              <Button variant="outline" className="w-full">
                Suivre mes demandes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {docCount === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun document disponible pour le moment.</p>
                <p className="text-sm mt-1">
                  Parcourez le catalogue pour faire une demande.
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                Vous avez {docCount} document(s) disponible(s) au
                téléchargement.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
