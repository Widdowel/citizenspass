import { prisma } from "@/lib/prisma";
import { DOC_TYPES, REQUEST_STATUS, AUTHORITIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  AlertTriangle,
  Activity,
  Building2,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const [
    userCount,
    docCount,
    exceptionCount,
    totalRequests,
    todayDocs,
    docsByType,
    docsByAuthority,
    recentRequests,
    auditEntries,
    avgProcessingMs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CITIZEN" } }),
    prisma.document.count(),
    prisma.request.count({ where: { status: "EXCEPTION" } }),
    prisma.request.count(),
    prisma.document.count({
      where: { issuedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.document.groupBy({ by: ["type"], _count: true }),
    prisma.document.groupBy({ by: ["authorityCode"], _count: true }),
    prisma.request.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, cip: true } } },
    }),
    prisma.auditLog.findMany({ take: 12, orderBy: { createdAt: "desc" } }),
    prisma.request.findMany({
      where: { processingStartedAt: { not: null }, processingEndedAt: { not: null } },
      take: 50,
      orderBy: { processingEndedAt: "desc" },
    }),
  ]);

  const avgMs =
    avgProcessingMs.length > 0
      ? avgProcessingMs.reduce((acc, r) => {
          if (r.processingStartedAt && r.processingEndedAt) {
            return acc + (r.processingEndedAt.getTime() - r.processingStartedAt.getTime());
          }
          return acc;
        }, 0) / avgProcessingMs.length
      : 0;

  const stats = [
    { label: "Citoyens enrôlés", value: userCount.toLocaleString("fr-FR"), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Documents délivrés", value: docCount.toLocaleString("fr-FR"), icon: FileText, color: "text-[#008751]", bg: "bg-[#008751]/10" },
    { label: "Délivrés aujourd'hui", value: todayDocs.toLocaleString("fr-FR"), icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Exceptions en revue", value: exceptionCount.toLocaleString("fr-FR"), icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const successRate =
    totalRequests > 0 ? Math.round(((totalRequests - exceptionCount) / totalRequests) * 100) : 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre d&apos;orchestration national</h1>
          <p className="text-gray-500 mt-1">
            Supervision en temps réel — République du Bénin
          </p>
        </div>
        <Link href="/admin/requests">
          <Button className="bg-[#008751] hover:bg-[#006b41]">
            Traiter les exceptions ({exceptionCount})
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taux de délivrance automatique</p>
                <p className="text-3xl font-bold text-[#008751]">{successRate}%</p>
                <p className="text-xs text-gray-400 mt-1">Sans intervention humaine</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-[#008751]/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Temps moyen de délivrance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Vs. ~2-30 jours avant BJ PASS
                </p>
              </div>
              <Clock className="w-10 h-10 text-purple-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par document</CardTitle>
            <CardDescription>Total émis depuis l&apos;ouverture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {docsByType.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun document émis</p>
            ) : (
              docsByType.map((d) => {
                const total = docsByType.reduce((s, x) => s + x._count, 0);
                const pct = Math.round((d._count / total) * 100);
                return (
                  <div key={d.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{DOC_TYPES[d.type]}</span>
                      <span className="text-gray-500 font-mono">{d._count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#008751]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autorités émettrices</CardTitle>
            <CardDescription>Volume signé par autorité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {docsByAuthority.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune signature émise</p>
            ) : (
              docsByAuthority.map((a) => (
                <div key={a.authorityCode} className="flex items-center gap-3 py-1">
                  <Building2 className="w-4 h-4 text-[#008751]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {AUTHORITIES[a.authorityCode as keyof typeof AUTHORITIES]?.name ?? a.authorityCode}
                    </p>
                  </div>
                  <Badge variant="secondary">{a._count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#008751]" />
              Journal d&apos;audit
            </CardTitle>
            <CardDescription>Chaîne de hash WORM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditEntries.map((e) => (
                <div key={e.id} className="text-xs border-l-2 border-[#008751]/30 pl-2 py-1">
                  <div className="font-medium text-gray-800">{e.action}</div>
                  <div className="text-gray-400 font-mono">
                    {new Date(e.createdAt).toLocaleTimeString("fr-FR")} — {e.actorType}
                  </div>
                  <div className="text-gray-300 font-mono text-[10px] truncate">
                    {e.hash.slice(0, 24)}…
                  </div>
                </div>
              ))}
              {auditEntries.length === 0 && (
                <p className="text-sm text-gray-400">Aucune entrée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes récentes</CardTitle>
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
                        {DOC_TYPES[req.type] || req.type} — CIP {req.user.cip}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={status.color}>{status.label}</Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
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
