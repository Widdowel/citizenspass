import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Key,
  Activity,
  AlertTriangle,
  Eye,
  Hash,
  Fingerprint,
} from "lucide-react";

export default async function AdminSecurityPage() {
  const [
    auditCount,
    auditLast,
    auditFirst,
    activeKeys,
    lockedAccounts,
    rateEvents24h,
    failedAuth24h,
    activeOtps,
    documentsSigned,
    verifiersActive,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.signingKey.findMany({ where: { isActive: true } }),
    prisma.accountLock.count({ where: { lockedUntil: { gt: new Date() } } }),
    prisma.rateLimitEvent.count({
      where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.auditLog.count({
      where: {
        action: { in: ["VERIFICATION_AUTH_FAILED", "OTP_FAILED"] },
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.otpCode.count({
      where: { consumed: false, expiresAt: { gt: new Date() } },
    }),
    prisma.document.count(),
    prisma.verifierApp.count({ where: { isActive: true } }),
  ]);

  const measures = [
    {
      title: "Signature numérique RSA-2048 / SHA-256",
      desc: "Chaque document est signé par la clé privée de l'autorité émettrice (Cour d'Appel, Mairie, DGI).",
      status: "active",
      icon: Key,
    },
    {
      title: "Clés privées chiffrées AES-256-GCM",
      desc: "Les clés en base sont enveloppées avec une KEK dérivée du secret applicatif via scrypt. En production : HSM FIPS 140-2 niveau 3.",
      status: "active",
      icon: Lock,
    },
    {
      title: "OTP haché bcrypt",
      desc: "Aucun code SMS n'est jamais stocké en clair. Comparaison constante côté serveur.",
      status: "active",
      icon: Fingerprint,
    },
    {
      title: "Verrouillage automatique du compte",
      desc: "Verrouillage 30 minutes après 5 codes OTP erronés consécutifs.",
      status: "active",
      icon: AlertTriangle,
    },
    {
      title: "Rate limiting",
      desc: "5 demandes OTP / 15 min par IP. 30 vérifications API / min par institution. 60 vérifications publiques de documents / min.",
      status: "active",
      icon: Activity,
    },
    {
      title: "Clés API B2B hachées (SHA-256)",
      desc: "Les institutions tierces s'authentifient avec une clé dont seul le hash est stocké. Vol de DB ⇒ aucune clé exploitable.",
      status: "active",
      icon: Hash,
    },
    {
      title: "Audit log en chaîne de hash (WORM)",
      desc: "Chaque entrée référence le hash de la précédente. Toute altération du journal est détectable.",
      status: "active",
      icon: Eye,
    },
    {
      title: "Vérification cryptographique publique",
      desc: "Tout citoyen / banque peut vérifier la validité d'un document via la clé publique de l'autorité émettrice.",
      status: "active",
      icon: ShieldCheck,
    },
    {
      title: "Headers de sécurité (CSP, HSTS, X-Frame-Options)",
      desc: "Protection contre clickjacking, MIME sniffing, downgrade HTTPS.",
      status: "active",
      icon: ShieldCheck,
    },
    {
      title: "Souveraineté des données",
      desc: "Hébergement en Europe (Ireland) — démo. Production : datacenter physique au Bénin.",
      status: "active",
      icon: Lock,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#008751]" />
          Sécurité &amp; Intégrité
        </h1>
        <p className="text-gray-500 mt-1">
          Mesures cryptographiques et opérationnelles actuellement actives.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Documents signés" value={documentsSigned} icon={Key} />
        <StatCard label="Clés actives" value={activeKeys.length} icon={Fingerprint} />
        <StatCard label="Entrées audit" value={auditCount} icon={Eye} />
        <StatCard label="Comptes verrouillés" value={lockedAccounts} icon={Lock} highlight={lockedAccounts > 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#008751]" />
              Activité dernières 24h
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Événements rate-limit" value={rateEvents24h} />
            <Row label="Authentifications échouées" value={failedAuth24h} />
            <Row label="OTP en cours" value={activeOtps} />
            <Row label="Tiers vérificateurs actifs" value={verifiersActive} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#008751]" />
              Journal d&apos;audit (chaîne de hash)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="font-mono text-gray-500">
              <div>Première entrée :</div>
              <div className="break-all">
                {auditFirst ? auditFirst.hash.slice(0, 32) + "…" : "—"}
              </div>
              <div className="mt-2">Dernière entrée :</div>
              <div className="break-all">
                {auditLast ? auditLast.hash.slice(0, 32) + "…" : "—"}
              </div>
            </div>
            <p className="text-gray-500 pt-2">
              Chaque entrée intègre le hash de la précédente. Une altération
              quelconque casse la chaîne.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-4">Mesures actives</h2>
      <div className="space-y-3">
        {measures.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.title}>
              <CardContent className="py-4 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{m.title}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Actif</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <strong>Pour la production réelle :</strong> à ajouter selon la roadmap sécurité — mTLS pour
        les connexions B2B, HSM physique pour les clés de signature, chiffrement champ-par-champ des
        données personnelles, audit annuel par tiers indépendant, bug bounty.
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: typeof Key;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-orange-300" : ""}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${highlight ? "text-orange-600" : "text-[#008751]/40"}`} />
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
