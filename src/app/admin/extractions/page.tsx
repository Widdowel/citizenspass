"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, FileSearch, CheckCircle2, Building2, MapPin, User, Loader2 } from "lucide-react";
import { DOC_TYPES } from "@/lib/constants";

type RegistrySnapshot = {
  id: string;
  cip: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCommune: string | null;
  birthDepartment: string | null;
  fatherName: string | null;
  motherName: string | null;
  address: string | null;
  commune: string | null;
  department: string | null;
  sourceType: string;
};

type ExtractionRequest = {
  id: string;
  type: string;
  reason: string | null;
  status: string;
  extractionTarget: string | null;
  exceptionReason: string | null;
  createdAt: string;
  user: { id: string; cip: string; name: string; registry: RegistrySnapshot | null };
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  middleName: "2ᵉ prénom",
  birthDate: "Date de naissance",
  birthPlace: "Lieu de naissance",
  birthCommune: "Commune de naissance",
  birthDepartment: "Département de naissance",
  fatherName: "Nom du père",
  motherName: "Nom de la mère",
  address: "Adresse",
  commune: "Commune",
  department: "Département",
};

const FIELDS_BY_TYPE: Record<string, string[]> = {
  BIRTH_CERTIFICATE: ["firstName", "lastName", "middleName", "birthDate", "birthPlace", "birthCommune", "birthDepartment", "fatherName", "motherName"],
  CRIMINAL_RECORD: ["firstName", "lastName", "birthDate", "birthPlace", "birthCommune"],
  RESIDENCE_CERTIFICATE: ["firstName", "lastName", "address", "commune", "department"],
  NATIONALITY_CERTIFICATE: ["firstName", "lastName", "birthDate", "birthPlace", "birthCommune"],
  TAX_CERTIFICATE: ["firstName", "lastName", "birthDate"],
};

export default function AdminExtractionsPage() {
  const [items, setItems] = useState<ExtractionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [paperRef, setPaperRef] = useState("");
  const [scanStage, setScanStage] = useState<"idle" | "scanning" | "ocr" | "review" | "submitting">("idle");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/admin/extractions");
    setItems(await res.json());
    setLoading(false);
  }

  function startExtraction(req: ExtractionRequest) {
    setEditing(req.id);
    const reg = req.user.registry;
    if (!reg) return;
    const initial: Record<string, string> = {
      firstName: reg.firstName ?? "",
      lastName: reg.lastName ?? "",
      middleName: reg.middleName ?? "",
      birthDate: reg.birthDate ? new Date(reg.birthDate).toISOString().split("T")[0] : "",
      birthPlace: reg.birthPlace ?? "",
      birthCommune: reg.birthCommune ?? "",
      birthDepartment: reg.birthDepartment ?? "",
      fatherName: reg.fatherName ?? "",
      motherName: reg.motherName ?? "",
      address: reg.address ?? "",
      commune: reg.commune ?? "",
      department: reg.department ?? "",
    };
    setFormValues(initial);
    setPaperRef("");
    setScanStage("scanning");
    // Simulation OCR : 2s scan, 1.5s OCR, puis review
    setTimeout(() => setScanStage("ocr"), 1800);
    setTimeout(() => {
      setScanStage("review");
      // Simule OCR qui pré-remplit certains champs
      const fields = FIELDS_BY_TYPE[req.type] ?? [];
      const ocrPrefilled: Record<string, string> = { ...initial };
      // Données fictives mais cohérentes
      if (fields.includes("birthDate") && !ocrPrefilled.birthDate)
        ocrPrefilled.birthDate = "1968-04-12";
      if (fields.includes("birthPlace") && !ocrPrefilled.birthPlace)
        ocrPrefilled.birthPlace = "Centre de santé d'Adjarra";
      if (fields.includes("birthCommune") && !ocrPrefilled.birthCommune)
        ocrPrefilled.birthCommune = "Adjarra";
      if (fields.includes("birthDepartment") && !ocrPrefilled.birthDepartment)
        ocrPrefilled.birthDepartment = "Ouémé";
      if (fields.includes("fatherName") && !ocrPrefilled.fatherName)
        ocrPrefilled.fatherName = "Agbessi Daniel";
      if (fields.includes("motherName") && !ocrPrefilled.motherName)
        ocrPrefilled.motherName = "Hounsa Élise";
      if (fields.includes("address") && !ocrPrefilled.address)
        ocrPrefilled.address = "Carré 215, Adjarra-Honmé";
      if (fields.includes("commune") && !ocrPrefilled.commune)
        ocrPrefilled.commune = "Adjarra";
      if (fields.includes("department") && !ocrPrefilled.department)
        ocrPrefilled.department = "Ouémé";
      setFormValues(ocrPrefilled);
      setPaperRef(`REG-${req.user.registry?.cip.slice(0, 4)}-1968-N°${Math.floor(Math.random() * 900 + 100)}`);
    }, 3300);
  }

  async function submitExtraction(id: string) {
    setSubmittingId(id);
    setScanStage("submitting");
    const res = await fetch(`/api/admin/extractions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formValues, paperReference: paperRef }),
    });
    setSubmittingId(null);
    if (res.ok) {
      setEditing(null);
      setScanStage("idle");
      await fetchItems();
    }
  }

  function cancelExtraction() {
    setEditing(null);
    setScanStage("idle");
    setFormValues({});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#008751]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-violet-600" />
          Numérisations en attente
        </h1>
        <p className="text-gray-500 mt-1">
          Demandes citoyennes nécessitant l&apos;extraction d&apos;un acte d&apos;origine au registre papier.
        </p>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6 text-sm text-violet-900">
        <strong>Procédure agent :</strong> récupérer le registre papier indiqué → cliquer « Lancer la numérisation »
        → l&apos;OCR pré-remplit les champs → vérifier visuellement → valider. Le citoyen reçoit le PDF signé immédiatement.
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            Aucune numérisation en attente. Tous les actes demandés sont déjà numériques.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((req) => (
            <Card key={req.id} className="border-violet-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{req.user.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">CIP {req.user.cip}</CardDescription>
                  </div>
                  <Badge className="bg-violet-100 text-violet-800">Numérisation</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-500 text-xs">Document demandé</div>
                      <div className="font-medium">{DOC_TYPES[req.type]}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-500 text-xs">Source à extraire</div>
                      <div className="font-medium">{req.extractionTarget}</div>
                    </div>
                  </div>
                </div>

                {editing !== req.id ? (
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => startExtraction(req)} className="bg-violet-600 hover:bg-violet-700">
                      <ScanLine className="w-4 h-4 mr-2" />
                      Lancer la numérisation
                    </Button>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    {scanStage === "scanning" && (
                      <ScanProgress label="Scan du registre papier en cours..." />
                    )}
                    {scanStage === "ocr" && (
                      <ScanProgress label="OCR en cours sur les champs structurés..." />
                    )}
                    {(scanStage === "review" || scanStage === "submitting") && (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <div>Scan + OCR terminés. Vérifiez chaque champ avant validation.</div>
                            <div className="mt-1 font-mono text-[11px]">Confiance OCR moyenne : 94%</div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`paperref-${req.id}`}>Référence du registre papier</Label>
                          <Input
                            id={`paperref-${req.id}`}
                            value={paperRef}
                            onChange={(e) => setPaperRef(e.target.value)}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {(FIELDS_BY_TYPE[req.type] ?? []).map((f) => (
                            <div key={f}>
                              <Label htmlFor={`${req.id}-${f}`} className="text-xs">{FIELD_LABELS[f] ?? f}</Label>
                              <Input
                                id={`${req.id}-${f}`}
                                type={f === "birthDate" ? "date" : "text"}
                                value={formValues[f] ?? ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({ ...prev, [f]: e.target.value }))
                                }
                                className="mt-1 text-sm"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button variant="outline" onClick={cancelExtraction} disabled={scanStage === "submitting"}>
                            Annuler
                          </Button>
                          <Button
                            onClick={() => submitExtraction(req.id)}
                            disabled={scanStage === "submitting"}
                            className="bg-[#008751] hover:bg-[#006b41]"
                          >
                            {submittingId === req.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Validation et signature...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Valider et délivrer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanProgress({ label }: { label: string }) {
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-lg p-6 text-center">
      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-violet-600" />
      <div className="text-sm font-medium text-violet-900">{label}</div>
      <div className="mt-3 h-1.5 bg-violet-200 rounded-full overflow-hidden">
        <div className="h-full bg-violet-600 animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  );
}
