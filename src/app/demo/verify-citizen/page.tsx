"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Hash,
  Key,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const VERIFIERS = [
  { apiKey: "demo_bank_bnp_001", name: "BNP Paribas Bénin", category: "Banque" },
  { apiKey: "demo_bank_ecobank_001", name: "Ecobank Bénin", category: "Banque" },
  { apiKey: "demo_employer_unicef_001", name: "UNICEF Bénin", category: "Employeur" },
  { apiKey: "demo_embassy_fr_001", name: "Ambassade de France à Cotonou", category: "Ambassade" },
  { apiKey: "demo_telecom_mtn_001", name: "MTN Bénin", category: "Télécom" },
];

const ATTRIBUTES = [
  { key: "isAdult", label: "Est majeur (≥ 18 ans)", default: true },
  { key: "isBeninCitizen", label: "Nationalité béninoise", default: true },
  { key: "hasCleanCriminalRecord", label: "Casier judiciaire vierge", default: true },
  { key: "isFiscallyCompliant", label: "À jour fiscalement", default: false },
  { key: "ageBracket", label: "Tranche d'âge (5 ans)", default: false },
  { key: "residesInDepartment", label: "Département de résidence", default: false },
  { key: "isMarried", label: "Marié(e)", default: false },
  { key: "fullName", label: "Nom & prénoms (sensible)", default: false },
];

export default function DemoVerifyCitizenPage() {
  const [verifier, setVerifier] = useState(VERIFIERS[0].apiKey);
  const [cip, setCip] = useState("1234-5678-9012");
  const [purpose, setPurpose] = useState("Ouverture d'un compte bancaire — vérification KYC simplifiée");
  const [selectedAttrs, setSelectedAttrs] = useState<Set<string>>(
    new Set(ATTRIBUTES.filter((a) => a.default).map((a) => a.key)),
  );
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  function toggleAttr(key: string) {
    const next = new Set(selectedAttrs);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedAttrs(next);
  }

  async function startVerification() {
    setError("");
    if (selectedAttrs.size === 0) {
      setError("Sélectionnez au moins un attribut");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/v1/verify-attributes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": verifier,
      },
      body: JSON.stringify({
        cip,
        attributes: Array.from(selectedAttrs),
        purpose,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur");
      return;
    }
    const data = await res.json();
    setVerificationId(data.verificationId);
    setAuthUrl(data.citizenAuthUrl);
    setStatus("PENDING");
    // Poll
    pollingRef.current = setInterval(() => poll(data.verificationId), 1500);
  }

  async function poll(id: string) {
    const res = await fetch(`/api/v1/verify-attributes/${id}`, {
      headers: { "X-API-Key": verifier },
    });
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.status);
    if (data.status === "AUTHORIZED" || data.status === "DENIED" || data.status === "EXPIRED") {
      setResponse(data);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }

  function reset() {
    setVerificationId(null);
    setAuthUrl(null);
    setStatus(null);
    setResponse(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="bg-blue-100 text-blue-800 mb-3">Démo institution / B2B</Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vérification de citoyen sans document
          </h1>
          <p className="text-gray-500">
            Simule l&apos;intégration d&apos;une banque, d&apos;un employeur ou d&apos;une ambassade avec
            l&apos;API CitizenPass. Aucun PDF n&apos;est échangé — uniquement les attributs nécessaires.
          </p>
        </div>

        {!verificationId ? (
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle requête de vérification</CardTitle>
              <CardDescription>
                Une fois envoyée, le citoyen reçoit une notification dans son app et autorise (ou refuse).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Institution émettrice</Label>
                <select
                  value={verifier}
                  onChange={(e) => setVerifier(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                >
                  {VERIFIERS.map((v) => (
                    <option key={v.apiKey} value={v.apiKey}>
                      {v.name} — {v.category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1 font-mono">X-API-Key : {verifier}</p>
              </div>

              <div>
                <Label htmlFor="cip">CIP du citoyen à vérifier</Label>
                <Input
                  id="cip"
                  value={cip}
                  onChange={(e) => setCip(e.target.value)}
                  placeholder="1234-5678-9012"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="purpose">Motif de la vérification</Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-2 block">Attributs demandés</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ATTRIBUTES.map((a) => (
                    <label
                      key={a.key}
                      className={`flex items-center gap-2 p-2.5 border rounded-md cursor-pointer text-sm ${
                        selectedAttrs.has(a.key)
                          ? "border-[#008751] bg-[#008751]/5"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttrs.has(a.key)}
                        onChange={() => toggleAttr(a.key)}
                        className="accent-[#008751]"
                      />
                      <span>{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

              <Button
                onClick={startVerification}
                disabled={submitting}
                className="w-full bg-[#008751] hover:bg-[#006b41]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi de la requête...
                  </>
                ) : (
                  <>
                    Envoyer la demande au citoyen
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
                <strong>Comment ça marche :</strong> notre API crée la demande, génère un lien
                d&apos;autorisation, et le citoyen est notifié dans son CitizenPass. Vous recevrez la
                réponse signée dès qu&apos;il aura validé biométriquement.
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResultView
            status={status}
            authUrl={authUrl}
            response={response}
            onReset={reset}
            verificationId={verificationId}
          />
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Cette démo est ouverte ; en production, l&apos;API exige mTLS + signature de chaque requête.
        </p>
      </div>
    </div>
  );
}

function ResultView({
  status,
  authUrl,
  response,
  onReset,
  verificationId,
}: {
  status: string | null;
  authUrl: string | null;
  response: unknown;
  onReset: () => void;
  verificationId: string;
}) {
  if (status === "PENDING") {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <Clock className="w-14 h-14 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">En attente de l&apos;autorisation citoyen</h2>
          <p className="text-gray-500 mb-1">
            Le citoyen a 30 minutes pour valider la demande.
          </p>
          <p className="text-xs text-gray-400 font-mono mb-6">Réf: {verificationId}</p>

          {authUrl && (
            <Link href={authUrl} target="_blank">
              <Button variant="outline" className="mb-3">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir le lien d&apos;autorisation (simule l&apos;app citoyen)
              </Button>
            </Link>
          )}
          <p className="text-xs text-gray-400">
            En production : le citoyen reçoit une notification push dans son app CitizenPass.
            Ici on simule en t&apos;ouvrant la page d&apos;autorisation.
          </p>

          <Button variant="ghost" onClick={onReset} className="mt-6">
            Annuler et recommencer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "AUTHORIZED" && response) {
    const r = response as {
      attributes: Record<string, unknown>;
      signature: { algorithm: string; keyId: string; payloadHash: string; signature: string };
      verifier: string;
    };
    return (
      <Card className="border-emerald-200">
        <CardContent className="pt-8 space-y-5">
          <div className="text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Autorisation reçue</h2>
            <p className="text-gray-500 text-sm">
              Réponse cryptographiquement signée par l&apos;État du Bénin
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#008751]" />
              Attributs vérifiés
            </h3>
            <div className="space-y-1.5">
              {Object.entries(
                (r.attributes as { attributes?: Record<string, unknown> }).attributes ?? {},
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center bg-emerald-50 rounded p-2.5 text-sm">
                  <span className="font-mono text-xs text-gray-600">{k}</span>
                  <span className="font-bold">
                    {typeof v === "boolean" ? (
                      v ? (
                        <span className="text-emerald-700">✓ OUI</span>
                      ) : (
                        <span className="text-red-700">✗ NON</span>
                      )
                    ) : typeof v === "object" && v !== null ? (
                      <span className="text-amber-700 text-xs">Indisponible</span>
                    ) : (
                      <span className="text-gray-900">{String(v)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#008751]" />
              Preuve cryptographique
            </h3>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono space-y-1 break-all">
              <div>
                <span className="text-gray-400">Algorithme : </span>
                {r.signature.algorithm}
              </div>
              <div>
                <span className="text-gray-400">Key ID : </span>
                {r.signature.keyId}
              </div>
              <div>
                <span className="text-gray-400">Hash : </span>
                <span className="text-[10px]">{r.signature.payloadHash}</span>
              </div>
              <div>
                <span className="text-gray-400">Signature : </span>
                <span className="text-[10px]">
                  {r.signature.signature.slice(0, 64)}…
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0 text-[#008751]" />
              Cette réponse est vérifiable hors-ligne avec la clé publique CitizenPass de la Cour
              d&apos;Appel de Cotonou.
            </p>
          </div>

          <Button onClick={onReset} variant="outline" className="w-full">
            Nouvelle vérification
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "DENIED") {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-8 pb-8 text-center">
          <XCircle className="w-14 h-14 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Demande refusée par le citoyen</h2>
          <p className="text-gray-500 mb-6">
            Aucune information ne vous a été communiquée.
          </p>
          <Button onClick={onReset}>Nouvelle vérification</Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "EXPIRED") {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Demande expirée</h2>
          <p className="text-gray-500 mb-6">Le citoyen n&apos;a pas répondu sous 30 minutes.</p>
          <Button onClick={onReset}>Renvoyer une demande</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </CardContent>
    </Card>
  );
}
