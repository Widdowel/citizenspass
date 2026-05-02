import { prisma } from "@/lib/prisma";
import { DOC_TYPES, REQUEST_STATUS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const [userCount, docCount, pendingCount, totalRequests] = await Promise.all([
    prisma.user.count({ where: { role: "CITIZEN" } }),
    prisma.document.count(),
    prisma.request.count({ where: { status: "PENDING" } }),
    prisma.request.count(),
  ]);

  const recentRequests = await prisma.request.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, nin: true } } },
  });

  const stats = [
    { label: "Citoyens", value: userCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Documents emis", value: docCount, icon: FileText, color: "text-[#008751]", bg: "bg-[#008751]/10" },
    { label: "En attente", value: pendingCount, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total demandes", value: totalRequests, icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-50" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-1">
            Gerez les demandes et suivez les statistiques
          </p>
        </div>
        <Link href="/admin/requests">
          <Button className="bg-[#008751] hover:bg-[#006b41]">
            Traiter les demandes ({pendingCount})
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
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

      <Card>
        <CardHeader>
          <CardTitle>Demandes recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune demande</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => {
                const status = REQUEST_STATUS[req.status] || { label: req.status, color: "bg-gray-100 text-gray-800" };
                return (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{req.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {DOC_TYPES[req.type] || req.type} — {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
