"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Building2,
  User,
  FileText,
} from "lucide-react";
import { TricolorLogo, TricolorBar } from "@/components/tricolor";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type VerifyResult = {
  valid: boolean;
  reason?: string;
  reasons?: { signatureValid: boolean; revoked: boolean; expired: boolean };
  document?: {
    serialNumber: string;
    title: string;
    type: string;
    typeCode: string;
    issuedAt: string;
    validUntil: string | null;
    revokedAt: string | null;
    issuingAuthority: string;
    authorityCode: string;
    holderName: string;
    holderCipMasked: string;
  };
  signature?: {
    algorithm: string;
    keyId: string;
    keyFingerprint: string | null;
    payloadHash: string;
    signatureExcerpt: string;
  };
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (initialCode) {
      void doVerify(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doVerify(c: string) {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/documents/verify?code=${encodeURIComponent(c)}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    void doVerify(code.trim());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#008751]/5 via-[#FAF7E8]/40 to-[#FCD116]/10">
      <TricolorBar variant="vertical" thickness="thin" />
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <TricolorLogo size="sm" />
            <span className="font-bold text-lg">BJ PASS</span>
          </Link>
          <span className="text-xs text-gray-500">Service public de vérification</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vérification d&apos;authenticité
          </h1>
          <p className="text-gray-500">
            Contrôle cryptographique des documents administratifs émis par la République du Bénin
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Code de vérification</CardTitle>
            <CardDescription>
              Le code se trouve sous le QR de chaque document officiel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code QR / Référence</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: DOC-XXXX-XXXX-XXXX-XXXX"
                  required
                  className="font-mono"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#008751] hover:bg-[#006b41]">
                {loading ? "Vérification cryptographique en cours…" : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Vérifier
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && <VerifyResultView result={result} />}
      </div>
    </div>
  );
}

function VerifyResultView({ result }: { result: VerifyResult }) {
  if (!result.document) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <div className="font-bold text-red-700">Document non reconnu</div>
              <div className="text-sm text-red-600">{result.reason}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { valid, reasons, document, signature } = result;
  const headerBg = valid ? "bg-emerald-600" : reasons?.expired ? "bg-orange-500" : "bg-red-600";
  const headerLabel = valid
    ? "DOCUMENT AUTHENTIQUE"
    : reasons?.revoked
    ? "DOCUMENT RÉVOQUÉ"
    : reasons?.expired
    ? "DOCUMENT EXPIRÉ"
    : "SIGNATURE INVALIDE";
  const Icon = valid ? CheckCircle2 : reasons?.expired ? AlertTriangle : XCircle;

  return (
    <Card className="overflow-hidden">
      <div className={`${headerBg} text-white px-6 py-4 flex items-center gap-3`}>
        <Icon className="w-7 h-7" />
        <div>
          <div className="font-bold text-lg tracking-wide">{headerLabel}</div>
          <div className="text-sm text-white/80">
            Vérification effectuée le {new Date().toLocaleString("fr-FR")}
          </div>
        </div>
      </div>
      <CardContent className="pt-6 space-y-6">
        <Section title="Document" icon={FileText}>
          <Field label="Type" value={document.title} />
          <Field label="Numéro de série" value={document.serialNumber} mono />
          <Field
            label="Date d'émission"
            value={new Date(document.issuedAt).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          />
          <Field
            label="Validité"
            value={
              document.validUntil
                ? `Valable jusqu'au ${new Date(document.validUntil).toLocaleDateString("fr-FR")}`
                : "Permanente"
            }
          />
          {document.revokedAt && (
            <Field label="Révoqué le" value={new Date(document.revokedAt).toLocaleDateString("fr-FR")} />
          )}
        </Section>

        <Section title="Titulaire" icon={User}>
          <Field label="Nom & Prénoms" value={document.holderName} />
          <Field label="Identifiant CIP (masqué)" value={document.holderCipMasked} mono />
        </Section>

        <Section title="Autorité émettrice" icon={Building2}>
          <Field label="Institution" value={document.issuingAuthority} />
          <Field label="Code autorité" value={document.authorityCode} mono />
        </Section>

        {signature && (
          <Section title="Vérification cryptographique" icon={Key}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={reasons?.signatureValid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                {reasons?.signatureValid ? "✓ Signature valide" : "✗ Signature invalide"}
              </Badge>
              {reasons?.expired && (
                <Badge className="bg-orange-100 text-orange-700">Expiré</Badge>
              )}
              {reasons?.revoked && (
                <Badge className="bg-red-100 text-red-700">Révoqué</Badge>
              )}
            </div>
            <Field label="Algorithme" value={signature.algorithm} mono />
            <Field label="Empreinte clé publique" value={signature.keyFingerprint ?? "—"} mono />
            <Field label="Identifiant clé" value={signature.keyId} mono />
            <Field label="Hash SHA-256 du document" value={signature.payloadHash} mono small />
            <Field label="Signature (extrait)" value={signature.signatureExcerpt} mono small />
          </Section>
        )}

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#008751]" />
          <p>
            Cette vérification utilise la clé publique de l&apos;autorité émettrice publiée par la PKI souveraine
            de l&apos;État du Bénin. Aucune donnée personnelle du titulaire n&apos;a été transmise au-delà de ce qui est strictement nécessaire à la vérification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <Icon className="w-4 h-4 text-[#008751]" />
        <span className="font-semibold text-sm uppercase tracking-wide text-gray-700">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-sm">
      <span className="text-gray-500 sm:w-48 shrink-0">{label}</span>
      <span className={`text-gray-900 break-all ${mono ? "font-mono" : ""} ${small ? "text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Chargement…</div>}>
      <VerifyContent />
    </Suspense>
  );
}

