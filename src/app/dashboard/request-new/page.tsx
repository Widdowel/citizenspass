"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Loader2,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  FileSignature,
  FileCheck2,
  ScanLine,
  Sparkles,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { PIPELINE_STEPS, DOC_PRICING, totalPrice, PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import Link from "next/link";

const docTypes = [
  { value: "BIRTH_CERTIFICATE", label: "Acte de naissance", authority: "Mairie de Cotonou" },
  { value: "CRIMINAL_RECORD", label: "Casier judiciaire (Bulletin n°3)", authority: "Cour d'Appel de Cotonou" },
  { value: "RESIDENCE_CERTIFICATE", label: "Certificat de résidence", authority: "Mairie de Cotonou" },
  { value: "NATIONALITY_CERTIFICATE", label: "Certificat de nationalité", authority: "Cour d'Appel de Cotonou" },
  { value: "TAX_CERTIFICATE", label: "Quitus fiscal", authority: "Direction Générale des Impôts" },
];

const stepIcons: Record<string, typeof Database> = {
  VERIFYING: Fingerprint,
  CHECKING: Database,
  GENERATING: ScanLine,
  SIGNING: FileSignature,
  READY: FileCheck2,
};

type RequestState = {
  id: string;
  status: string;
  pipelineStep: string | null;
  exceptionReason: string | null;
  document: { id: string; serialNumber: string; qrCode: string } | null;
  payment?: { id: string; status: string; amount: number; method: string } | null;
};

type Step = "form" | "biometric" | "creating" | "payment" | "processing" | "ready" | "exception";

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function RequestNewPage() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [bioStage, setBioStage] = useState<"idle" | "scanning" | "matched">("idle");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "sending" | "confirming" | "done">("idle");
  const [skipping, setSkipping] = useState(false);
  const [reqState, setReqState] = useState<RequestState | null>(null);
  const [error, setError] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  const price = type ? totalPrice(type) : 0;
  const pricing = type ? DOC_PRICING[type] : undefined;

  function startBiometric(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!type) {
      setError("Veuillez choisir un type de document.");
      return;
    }
    setStep("biometric");
    setBioStage("scanning");
    setTimeout(() => setBioStage("matched"), 2000);
    setTimeout(() => {
      setStep("creating");
      void createRequest();
    }, 2800);
  }

  async function createRequest() {
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de la demande.");
        setStep("form");
        return;
      }
      const created = await res.json();
      setRequestId(created.id);
      setStep("payment");
    } catch (e) {
      setError("Erreur réseau. Réessayez.");
      setStep("form");
    }
  }

  async function submitPayment() {
    if (!requestId || !paymentMethod) return;
    if (PAYMENT_METHODS[paymentMethod].needsPhone && !phoneNumber) {
      setError("Numéro de téléphone requis pour Mobile Money");
      return;
    }
    setError("");
    setPaymentSubmitting(true);
    setPaymentStage("sending");

    const init = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        method: paymentMethod,
        phoneNumber: PAYMENT_METHODS[paymentMethod].needsPhone ? phoneNumber : undefined,
      }),
    });
    if (!init.ok) {
      const data = await init.json();
      setError(data.error ?? "Erreur initialisation paiement");
      setPaymentSubmitting(false);
      setPaymentStage("idle");
      return;
    }
    const { paymentId: pid } = await init.json();
    setPaymentId(pid);

    // Simule l'attente de confirmation opérateur (~2s)
    await new Promise((r) => setTimeout(r, 2200));
    setPaymentStage("confirming");

    const confirm = await fetch(`/api/payments/${pid}/confirm`, { method: "POST" });
    if (!confirm.ok) {
      setError("Confirmation paiement échouée");
      setPaymentSubmitting(false);
      setPaymentStage("idle");
      return;
    }

    setPaymentStage("done");
    await new Promise((r) => setTimeout(r, 600));
    setStep("processing");
    setPaymentSubmitting(false);
    pollingRef.current = setInterval(() => poll(requestId), 700);
  }

  async function skipPayment() {
    if (!requestId) return;
    setError("");
    setSkipping(true);
    const res = await fetch("/api/payments/skip-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Skip indisponible");
      setSkipping(false);
      return;
    }
    setSkipping(false);
    setStep("processing");
    pollingRef.current = setInterval(() => poll(requestId), 700);
  }

  async function poll(id: string) {
    const res = await fetch(`/api/requests/${id}`);
    if (!res.ok) return;
    const data: RequestState = await res.json();
    setReqState(data);
    if (data.status === "READY") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStep("ready");
    } else if (data.status === "EXCEPTION" || data.status === "REJECTED") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStep("exception");
    }
  }

  const currentStepIndex = (() => {
    if (!reqState) return -1;
    const order = ["VERIFYING", "CHECKING", "GENERATING", "SIGNING", "READY"];
    const stepName = reqState.pipelineStep ?? "PENDING";
    if (stepName === "EXCEPTION") return -2;
    return order.indexOf(stepName);
  })();

  // ÉTAPE READY
  if (step === "ready" && reqState?.document) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-emerald-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Document délivré</h2>
            <p className="text-gray-500 mb-6">
              Votre document a été généré, signé numériquement et inscrit au registre national.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 font-mono text-xs space-y-1">
              <div><span className="text-gray-400">Numéro de série :</span> {reqState.document.serialNumber}</div>
              <div><span className="text-gray-400">Code de vérification :</span> {reqState.document.qrCode}</div>
              {reqState.payment && (
                <div><span className="text-gray-400">Référence paiement :</span> {reqState.payment.method} — {formatXOF(reqState.payment.amount)}</div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/api/documents/${reqState.document.id}/file`} target="_blank">
                <Button className="bg-[#008751] hover:bg-[#006b41]">Télécharger le PDF officiel</Button>
              </Link>
              <Button variant="outline" onClick={() => router.push("/dashboard/documents")}>
                Voir tous mes documents
                <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE EXCEPTION
  if (step === "exception" && reqState) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-orange-200">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Délivrance non automatique</h2>
                <p className="text-sm text-gray-500">Une revue manuelle est requise par l&apos;autorité émettrice</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-900">
              {reqState.exceptionReason}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 mt-4">
              <strong>Garantie :</strong> votre paiement de {reqState.payment ? formatXOF(reqState.payment.amount) : "—"} sera automatiquement remboursé sous 24h si la délivrance n&apos;aboutit pas.
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push("/dashboard/requests")} className="bg-[#008751] hover:bg-[#006b41]">
                Suivre ma demande
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE PROCESSING
  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#008751]" />
              Traitement en cours
            </CardTitle>
            <CardDescription>
              Pipeline d&apos;orchestration sécurisé — votre document est en cours de délivrance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PIPELINE_STEPS.map((s, idx) => {
                const Icon = stepIcons[s.key] ?? Database;
                const isDone = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const isPending = currentStepIndex < idx;
                return (
                  <div
                    key={s.key}
                    className={`flex gap-4 items-start p-4 rounded-lg border transition-all ${
                      isCurrent ? "border-[#008751] bg-[#008751]/5"
                      : isDone ? "border-emerald-200 bg-emerald-50/50"
                      : "border-gray-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? "bg-emerald-500 text-white"
                      : isCurrent ? "bg-[#008751] text-white animate-pulse"
                      : "bg-gray-100 text-gray-400"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isPending ? "text-gray-400" : "text-gray-900"}`}>{s.label}</div>
                      <div className={`text-sm ${isPending ? "text-gray-300" : "text-gray-500"}`}>{s.description}</div>
                    </div>
                    {isCurrent && <Loader2 className="w-4 h-4 animate-spin text-[#008751] mt-3" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE PAYMENT
  if (step === "payment" && pricing) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#008751]" />
              Paiement du timbre fiscal
            </CardTitle>
            <CardDescription>
              Le règlement est requis avant la délivrance. Remboursement automatique en cas de rejet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-[#008751]/5 to-[#FCD116]/5 rounded-lg p-4 border border-[#008751]/20">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Timbre fiscal officiel</span>
                <span className="font-mono">{formatXOF(pricing.stamp)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Frais de service CitizenPass</span>
                <span className="font-mono">{formatXOF(pricing.serviceFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-[#008751]/20">
                <span>Total à payer</span>
                <span className="text-[#008751] font-mono">{formatXOF(price)}</span>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Méthode de paiement</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, typeof PAYMENT_METHODS[PaymentMethod]][]).map(
                  ([key, m]) => {
                    const selected = paymentMethod === key;
                    const Icon = m.needsPhone ? Smartphone : CreditCard;
                    const isOfficial = "badge" in m && m.badge === "Officiel";
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentMethod(key)}
                        className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                          selected
                            ? "border-[#008751] bg-[#008751]/5"
                            : isOfficial
                            ? "border-[#008751]/40 hover:border-[#008751]/60 bg-[#008751]/[0.02]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isOfficial && (
                          <span className="absolute -top-2 right-3 bg-[#008751] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Officiel
                          </span>
                        )}
                        <div className={`w-8 h-8 rounded ${m.color} flex items-center justify-center mb-2`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="font-semibold text-sm">{m.short}</div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </button>
                    );
                  },
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                BJ Pay est la passerelle gouvernementale officielle. Les frais de service y sont réduits.
              </p>
            </div>

            {paymentMethod && PAYMENT_METHODS[paymentMethod].needsPhone && (
              <div>
                <Label htmlFor="phone">Numéro {PAYMENT_METHODS[paymentMethod].short}</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+229 97 00 00 00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Vous recevrez un code USSD pour confirmer.
                </p>
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Numéro de carte</Label>
                  <Input placeholder="4111 1111 1111 1111" className="mt-1 font-mono" />
                </div>
                <div>
                  <Label>Expiration</Label>
                  <Input placeholder="MM/AA" className="mt-1" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input placeholder="123" className="mt-1" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <Button
              onClick={submitPayment}
              disabled={!paymentMethod || paymentSubmitting || skipping}
              className="w-full bg-[#008751] hover:bg-[#006b41] h-11"
            >
              {paymentSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {paymentStage === "sending" && "Envoi de la requête à l'opérateur..."}
                  {paymentStage === "confirming" && "Confirmation en cours..."}
                  {paymentStage === "done" && "Paiement validé !"}
                </>
              ) : (
                <>Payer {formatXOF(price)}</>
              )}
            </Button>

            <button
              type="button"
              onClick={skipPayment}
              disabled={paymentSubmitting || skipping}
              className="w-full text-xs text-amber-700 hover:text-amber-900 underline-offset-4 hover:underline disabled:opacity-50"
            >
              {skipping ? "Saut en cours..." : "⚡ Sauter le paiement (mode démo uniquement)"}
            </button>

            <p className="text-xs text-gray-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#008751]" />
              Transactions sécurisées via l&apos;agrégateur national. Reçu fiscal numérique automatiquement émis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE CREATING (transition entre bio matched et payment)
  if (step === "creating") {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="w-12 h-12 text-[#008751] mx-auto mb-4 animate-spin" />
            <h3 className="font-bold mb-1">Création de votre demande</h3>
            <p className="text-sm text-gray-500">
              Initialisation sécurisée du dossier...
            </p>
            <p className="text-xs text-gray-400 mt-3">
              La première demande peut prendre quelques secondes (initialisation cryptographique).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ÉTAPE BIOMETRIC
  if (step === "biometric") {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Authentification biométrique</DialogTitle>
            <DialogDescription>Posez votre doigt sur le capteur.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              bioStage === "matched" ? "bg-emerald-100" : "bg-[#008751]/10 animate-pulse"
            }`}>
              {bioStage === "matched" ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              ) : (
                <Fingerprint className="w-16 h-16 text-[#008751]" />
              )}
              {bioStage === "scanning" && (
                <div className="absolute inset-0 border-4 border-[#008751]/30 border-t-[#008751] rounded-full animate-spin" />
              )}
            </div>
            <p className="mt-4 text-sm font-medium">
              {bioStage === "scanning" && "Lecture biométrique…"}
              {bioStage === "matched" && "Identité confirmée"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {bioStage === "matched" ? "Correspondance ANIP : 98.7%" : "Comparaison avec le gabarit ANIP en cours"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ÉTAPE FORMULAIRE
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande</h1>
        <p className="text-gray-500 mt-1">
          Sélectionnez un document. Délivrance automatique en moins de 90 secondes après paiement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de demande</CardTitle>
          <CardDescription>
            Vous serez authentifié(e) biométriquement, puis vous procéderez au paiement du timbre fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={startBiometric} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type de document *</Label>
              <Select name="type" required value={type} onValueChange={(v) => setType(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type de document" />
                </SelectTrigger>
                <SelectContent>
                  {docTypes.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      <div className="flex flex-col">
                        <span>{dt.label}</span>
                        <span className="text-xs text-gray-400">
                          {dt.authority} — {formatXOF(totalPrice(dt.value))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type && pricing && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="text-gray-500">Coût total : </span>
                <span className="font-bold text-gray-900">{formatXOF(price)}</span>
                <span className="text-gray-400 ml-1">
                  ({formatXOF(pricing.stamp)} timbre + {formatXOF(pricing.serviceFee)} service)
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Motif de la demande</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : Candidature à un concours administratif"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#008751] hover:bg-[#006b41] h-11"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Authentifier &amp; continuer
            </Button>

            <p className="text-xs text-gray-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#008751]" />
              Vos données ne quittent pas le territoire national. Chaque accès est journalisé conformément à la Loi 2009-09.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
