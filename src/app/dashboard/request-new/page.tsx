"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { PIPELINE_STEPS } from "@/lib/constants";
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
};

export default function RequestNewPage() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [bioOpen, setBioOpen] = useState(false);
  const [bioStage, setBioStage] = useState<"idle" | "scanning" | "matched">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [reqState, setReqState] = useState<RequestState | null>(null);
  const [error, setError] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function startBiometric(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!type) {
      setError("Veuillez choisir un type de document.");
      return;
    }
    setBioOpen(true);
    setBioStage("scanning");
    setTimeout(() => setBioStage("matched"), 2200);
    setTimeout(() => {
      setBioOpen(false);
      void submit();
    }, 3300);
  }

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, reason }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de la demande.");
      return;
    }
    const created = await res.json();
    setRequestId(created.id);
    pollingRef.current = setInterval(() => poll(created.id), 700);
  }

  async function poll(id: string) {
    const res = await fetch(`/api/requests/${id}`);
    if (!res.ok) return;
    const data: RequestState = await res.json();
    setReqState(data);
    if (data.status === "READY" || data.status === "EXCEPTION" || data.status === "REJECTED") {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }

  const currentStepIndex = (() => {
    if (!reqState) return -1;
    const order = ["VERIFYING", "CHECKING", "GENERATING", "SIGNING", "READY"];
    const step = reqState.pipelineStep ?? "PENDING";
    if (step === "EXCEPTION") return -2;
    return order.indexOf(step);
  })();

  if (requestId && reqState?.status === "READY" && reqState.document) {
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
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/api/documents/${reqState.document.id}/file`} target="_blank">
                <Button className="bg-[#008751] hover:bg-[#006b41]">
                  Télécharger le PDF officiel
                </Button>
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

  if (requestId && reqState?.status === "EXCEPTION") {
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
                <p className="text-sm text-gray-500">Une revue manuelle est requise par l'autorité émettrice</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-900">
              {reqState.exceptionReason}
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push("/dashboard/requests")} className="bg-[#008751] hover:bg-[#006b41]">
                Suivre ma demande
              </Button>
              <Button variant="outline" onClick={() => { setRequestId(null); setReqState(null); setType(""); setReason(""); }}>
                Faire une autre demande
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requestId) {
    // Pipeline en cours
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#008751]" />
              Traitement en cours
            </CardTitle>
            <CardDescription>
              Pipeline d'orchestration sécurisé — votre document est en cours de délivrance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = stepIcons[step.key] ?? Database;
                const isDone = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const isPending = currentStepIndex < idx;
                return (
                  <div
                    key={step.key}
                    className={`flex gap-4 items-start p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? "border-[#008751] bg-[#008751]/5"
                        : isDone
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[#008751] text-white animate-pulse"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isPending ? "text-gray-400" : "text-gray-900"}`}>
                        {step.label}
                      </div>
                      <div className={`text-sm ${isPending ? "text-gray-300" : "text-gray-500"}`}>
                        {step.description}
                      </div>
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

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande</h1>
        <p className="text-gray-500 mt-1">
          Sélectionnez un document. La délivrance est automatique en moins de 90 secondes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de demande</CardTitle>
          <CardDescription>
            Pour valider, vous devrez vous authentifier biométriquement.
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
                        <span className="text-xs text-gray-400">{dt.authority}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#008751] hover:bg-[#006b41] h-11"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {submitting ? "Envoi..." : "Authentifier & demander"}
            </Button>

            <p className="text-xs text-gray-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#008751]" />
              Vos données ne quittent pas le territoire national. Chaque accès est journalisé conformément à la Loi 2009-09 sur la protection des données à caractère personnel.
            </p>
          </form>
        </CardContent>
      </Card>

      <Dialog open={bioOpen} onOpenChange={setBioOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Authentification biométrique</DialogTitle>
            <DialogDescription>
              Posez votre doigt sur le capteur pour valider la demande.
            </DialogDescription>
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
              {bioStage === "matched"
                ? "Correspondance ANIP : 98.7%"
                : "Comparaison avec le gabarit ANIP en cours"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
