"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Eye,
  Fingerprint,
  Clock,
} from "lucide-react";

const SENSITIVITY_BADGE: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Modérée", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Élevée", color: "bg-red-100 text-red-700" },
};

type Detail = {
  verificationId: string;
  status: "PENDING" | "AUTHORIZED" | "DENIED" | "EXPIRED";
  verifier: { name: string; category: string };
  purpose: string | null;
  attributesAsked: { key: string; label: string; sensitivity: "low" | "medium" | "high" }[];
  expiresAt: string;
  createdAt: string;
};

export default function VerificationDecisionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"AUTHORIZE" | "DENY" | null>(null);
  const [communeParam, setCommuneParam] = useState("");
  const [bioConfirming, setBioConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/verifications/${id}`);
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }

  async function decide(decision: "AUTHORIZE" | "DENY") {
    setSubmitting(decision);
    setError("");

    if (decision === "AUTHORIZE") {
      // Modal biométrique avant signature
      setBioConfirming(true);
      await new Promise((r) => setTimeout(r, 2000));
      setBioConfirming(false);
    }

    const res = await fetch(`/api/verifications/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        parameters: communeParam ? { commune: communeParam } : undefined,
      }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#008751]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            Demande de vérification introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const needsCommune = detail.attributesAsked.some((a) => a.key === "residesInCommune");
  const expired = new Date(detail.expiresAt) < new Date();

  if (detail.status === "AUTHORIZED") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-emerald-200">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vérification autorisée</h2>
            <p className="text-gray-500 mb-4">
              <strong>{detail.verifier.name}</strong> a reçu votre réponse signée.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Votre document complet n&apos;a pas été partagé — seuls les attributs demandés ont été transmis,
              cryptographiquement signés par l&apos;État du Bénin.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detail.status === "DENIED" || detail.status === "EXPIRED" || expired) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {detail.status === "DENIED" ? "Demande refusée" : "Demande expirée"}
            </h2>
            <p className="text-gray-500 mb-6">
              {detail.status === "DENIED"
                ? "Aucune information n'a été partagée."
                : "Le délai de 30 minutes pour autoriser cette demande est dépassé."}
            </p>
            <Button onClick={() => router.push("/dashboard")}>Retour au tableau de bord</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {bioConfirming && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="max-w-sm w-full mx-4">
            <CardContent className="pt-6 pb-6 text-center">
              <div className="w-24 h-24 rounded-full bg-[#008751]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Fingerprint className="w-12 h-12 text-[#008751]" />
              </div>
              <h3 className="font-bold mb-1">Authentification biométrique</h3>
              <p className="text-sm text-gray-500">Validation du partage en cours...</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#008751]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[#008751]" />
            </div>
            <div className="flex-1">
              <CardTitle>{detail.verifier.name}</CardTitle>
              <CardDescription>
                souhaite vérifier des informations vous concernant
              </CardDescription>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              30 min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {detail.purpose && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <strong>Motif déclaré : </strong>
              {detail.purpose}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#008751]" />
              Informations qui seront partagées
            </h3>
            <div className="space-y-2">
              {detail.attributesAsked.map((a) => (
                <div
                  key={a.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{a.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{a.key}</div>
                  </div>
                  <Badge className={SENSITIVITY_BADGE[a.sensitivity].color}>
                    Sensibilité {SENSITIVITY_BADGE[a.sensitivity].label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {needsCommune && (
            <div>
              <Label htmlFor="commune">Commune à vérifier</Label>
              <Input
                id="commune"
                value={communeParam}
                onChange={(e) => setCommuneParam(e.target.value)}
                placeholder="Ex : Cotonou"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Le tiers vérifie si vous résidez dans cette commune. Seul un &quot;oui/non&quot; est partagé.
              </p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Vos documents ne sont pas partagés</p>
              <p className="text-xs">
                Seuls les attributs ci-dessus sont transmis, signés cryptographiquement par
                l&apos;État du Bénin. {detail.verifier.name} ne reçoit aucun PDF, aucune photo, aucun détail
                non listé.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => decide("DENY")}
              disabled={submitting !== null}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
            <Button
              className="flex-1 bg-[#008751] hover:bg-[#006b41]"
              onClick={() => decide("AUTHORIZE")}
              disabled={submitting !== null || (needsCommune && !communeParam)}
            >
              {submitting === "AUTHORIZE" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signature...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Autoriser et signer
                </>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            Cette autorisation est unique et ne donne pas accès à vos données pour de futures requêtes.
            Audit complet disponible dans votre journal d&apos;activité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
