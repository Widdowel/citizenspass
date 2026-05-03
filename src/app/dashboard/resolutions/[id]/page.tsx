"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CreditCard,
  Smartphone,
  Loader2,
  CheckCircle2,
  Clock,
  Scale,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

type Resolution = {
  id: string;
  type: "FISCAL_DEBT" | "JUDICIAL_REVIEW";
  amount: number;
  description: string;
  status: string;
  citizenComment: string | null;
  reviewerNote: string | null;
  request: { type: string; id: string };
};

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function ResolutionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [r, setR] = useState<Resolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"idle" | "paying" | "confirming" | "done" | "queued">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/resolutions/${id}`);
    if (res.ok) setR(await res.json());
    setLoading(false);
  }

  async function pay() {
    if (!r || !method) return;
    setError("");
    if (PAYMENT_METHODS[method].needsPhone && !phoneNumber) {
      setError("Numéro de téléphone requis");
      return;
    }
    setSubmitting(true);
    setStage("paying");
    const res = await fetch(`/api/resolutions/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        phoneNumber: PAYMENT_METHODS[method].needsPhone ? phoneNumber : undefined,
        citizenComment: comment,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur");
      setSubmitting(false);
      setStage("idle");
      return;
    }
    const data = await res.json();
    if (data.autoApproved) {
      setStage("done");
      setTimeout(() => router.push(`/dashboard/requests`), 2000);
    } else {
      setStage("queued");
    }
  }

  if (loading || !r) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#008751]" />
      </div>
    );
  }

  const isFiscal = r.type === "FISCAL_DEBT";
  const Icon = isFiscal ? Receipt : Scale;

  if (stage === "done") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-emerald-200">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Régularisation validée</h2>
            <p className="text-gray-500 mb-1">
              Votre situation fiscale a été mise à jour automatiquement.
            </p>
            <p className="text-sm text-gray-400">
              Votre quitus est en cours de génération… vous y êtes redirigé(e).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "queued" || r.status === "PENDING_REVIEW") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-yellow-200">
          <CardContent className="pt-8 pb-8 text-center">
            <Clock className="w-14 h-14 text-yellow-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">En attente du greffier</h2>
            <p className="text-gray-500 mb-1">
              Votre demande a été soumise au greffe de la Cour d&apos;Appel de Cotonou.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Délai de traitement : quelques heures (vs. plusieurs semaines auparavant).
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard/requests")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (r.status === "REJECTED") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-xl font-bold mb-2">Demande de revue rejetée</h2>
            {r.reviewerNote && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm mt-3">
                <strong>Motif du greffier : </strong>
                {r.reviewerNote}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl ${isFiscal ? "bg-blue-100" : "bg-violet-100"} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${isFiscal ? "text-blue-700" : "text-violet-700"}`} />
            </div>
            <div className="flex-1">
              <CardTitle>
                {isFiscal ? "Régularisation fiscale" : "Demande de revue judiciaire"}
              </CardTitle>
              <CardDescription>
                {isFiscal
                  ? "Direction Générale des Impôts"
                  : "Greffe de la Cour d'Appel de Cotonou"}
              </CardDescription>
            </div>
            <Badge className={isFiscal ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"}>
              {isFiscal ? "Auto" : "Validation greffe"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            {r.description}
          </div>

          {isFiscal ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Régularisation 100% automatique.</strong>
                <p className="text-xs mt-1">
                  Dès que votre paiement est confirmé, votre statut fiscal passe à « À jour » et votre
                  quitus est généré automatiquement. Aucune intervention humaine.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-900 flex items-start gap-2">
              <Scale className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Procédure accélérée.</strong>
                <p className="text-xs mt-1">
                  Après paiement, le greffier reçoit votre demande en file prioritaire. Délai cible :
                  quelques heures. Vous serez notifié(e) dans BJ PASS.
                </p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#008751]/5 to-[#FCD116]/5 rounded-lg p-4 border border-[#008751]/20">
            <div className="flex justify-between text-base font-bold">
              <span>Montant à payer</span>
              <span className="text-[#008751] font-mono">{formatXOF(r.amount)}</span>
            </div>
          </div>

          {!isFiscal && (
            <div>
              <Label htmlFor="comment">Commentaire / pièces justificatives (optionnel)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Ex : Jugement de relaxe n° XYZ rendu le ../../, je peux fournir copie au greffe sur demande."
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="mb-2 block">Méthode de paiement</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, typeof PAYMENT_METHODS[PaymentMethod]][]).map(
                ([key, m]) => {
                  const selected = method === key;
                  const PIcon = m.needsPhone ? Smartphone : CreditCard;
                  const isOfficial = "badge" in m && m.badge === "Officiel";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMethod(key)}
                      className={`relative p-3 border-2 rounded-lg text-left transition-all ${
                        selected
                          ? "border-[#008751] bg-[#008751]/5"
                          : isOfficial
                          ? "border-[#008751]/40 hover:border-[#008751]/60"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {isOfficial && (
                        <span className="absolute -top-2 right-2 bg-[#008751] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                          Officiel
                        </span>
                      )}
                      <div className={`w-7 h-7 rounded ${m.color} flex items-center justify-center mb-1`}>
                        <PIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="font-semibold text-xs">{m.short}</div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {method && PAYMENT_METHODS[method].needsPhone && (
            <div>
              <Label htmlFor="phone">Numéro {PAYMENT_METHODS[method].short}</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="mt-1"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <Button
            onClick={pay}
            disabled={!method || submitting}
            className="w-full bg-[#008751] hover:bg-[#006b41] h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {stage === "paying" && "Paiement en cours..."}
                {stage === "confirming" && "Confirmation..."}
              </>
            ) : (
              <>Régler {formatXOF(r.amount)}</>
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Vous restez dans BJ PASS pendant tout le processus. Pas besoin de vous déplacer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
