"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const DOC_TYPES: Record<string, string> = {
  BIRTH_CERTIFICATE: "Acte de naissance",
  CRIMINAL_RECORD: "Casier judiciaire",
  RESIDENCE_CERTIFICATE: "Certificat de residence",
  NATIONALITY_CERTIFICATE: "Certificat de nationalite",
  MARRIAGE_CERTIFICATE: "Acte de mariage",
  DEATH_CERTIFICATE: "Acte de deces",
  DRIVER_LICENSE: "Permis de conduire",
  TAX_CERTIFICATE: "Attestation fiscale",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "En traitement", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "Approuve", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejete", color: "bg-red-100 text-red-800" },
  READY: { label: "Pret", color: "bg-emerald-100 text-emerald-800" },
};

type RequestItem = {
  id: string;
  type: string;
  reason: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  user: { name: string; nin: string };
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/requests")
      .then((r) => r.json())
      .then(setRequests);
  }, []);

  async function handleAction(id: string, status: string) {
    setLoading((prev) => ({ ...prev, [id]: true }));
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: notes[id] || "" }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: status === "APPROVED" ? "READY" : status }
            : r
        )
      );
    }
    setLoading((prev) => ({ ...prev, [id]: false }));
  }

  const pending = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING");
  const processed = requests.filter((r) => r.status !== "PENDING" && r.status !== "PROCESSING");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Traitement des demandes
        </h1>
        <p className="text-gray-500 mt-1">
          Approuvez ou rejetez les demandes des citoyens
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-yellow-600" />
        En attente ({pending.length})
      </h2>

      {pending.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-gray-400">
            Aucune demande en attente
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map((req) => (
            <Card key={req.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{req.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      NIN: {req.user.nin} —{" "}
                      {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-sm mt-1">
                      <strong>{DOC_TYPES[req.type] || req.type}</strong>
                    </p>
                    {req.reason && (
                      <p className="text-sm text-gray-500 mt-1">
                        Motif : {req.reason}
                      </p>
                    )}
                  </div>
                  <Badge className={STATUS_MAP[req.status]?.color}>
                    {STATUS_MAP[req.status]?.label}
                  </Badge>
                </div>
                <Textarea
                  placeholder="Note (optionnel)..."
                  className="mb-3"
                  value={notes[req.id] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction(req.id, "APPROVED")}
                    disabled={loading[req.id]}
                    className="bg-[#008751] hover:bg-[#006b41]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleAction(req.id, "REJECTED")}
                    disabled={loading[req.id]}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">
        Demandes traitees ({processed.length})
      </h2>
      <div className="space-y-2">
        {processed.map((req) => {
          const status = STATUS_MAP[req.status] || { label: req.status, color: "bg-gray-100 text-gray-800" };
          return (
            <Card key={req.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{req.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {DOC_TYPES[req.type] || req.type} —{" "}
                      {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
