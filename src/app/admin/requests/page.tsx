"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { DOC_TYPES, REQUEST_STATUS } from "@/lib/constants";

type RequestItem = {
  id: string;
  type: string;
  reason: string | null;
  status: string;
  pipelineStep: string | null;
  exceptionReason: string | null;
  note: string | null;
  autoProcessed: boolean;
  createdAt: string;
  user: { name: string; cip: string };
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

  const exceptions = requests.filter((r) => r.status === "EXCEPTION");
  const inFlight = requests.filter((r) =>
    ["PENDING", "VERIFYING", "CHECKING", "GENERATING", "SIGNING"].includes(r.status),
  );
  const processed = requests.filter((r) =>
    ["READY", "REJECTED"].includes(r.status),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pilotage des demandes</h1>
        <p className="text-gray-500 mt-1">
          Le pipeline traite automatiquement les demandes éligibles. Seules les exceptions remontent ici.
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        Exceptions à arbitrer ({exceptions.length})
      </h2>

      {exceptions.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-gray-400">
            Aucune exception. Le pipeline traite toutes les demandes automatiquement.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {exceptions.map((req) => (
            <Card key={req.id} className="border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{req.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      CIP: <span className="font-mono">{req.user.cip}</span> —{" "}
                      {new Date(req.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <p className="text-sm mt-1">
                      <strong>{DOC_TYPES[req.type] || req.type}</strong>
                    </p>
                    {req.reason && (
                      <p className="text-sm text-gray-500 mt-1">Motif : {req.reason}</p>
                    )}
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Exception</Badge>
                </div>
                {req.exceptionReason && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900 mb-4">
                    <strong>Motif d&apos;exception : </strong>
                    {req.exceptionReason}
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                  <strong>Aucune action possible depuis BJ PASS.</strong>
                  <p className="mt-1">
                    Cette exception relève d&apos;une autorité tierce. Le citoyen doit régulariser sa situation
                    auprès de l&apos;autorité compétente (DGI pour le fiscal, greffe de la Cour d&apos;Appel pour
                    le judiciaire). La demande sera automatiquement re-traitée à la prochaine tentative
                    après régularisation.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inFlight.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            En cours de traitement ({inFlight.length})
          </h2>
          <div className="space-y-2 mb-8">
            {inFlight.map((req) => {
              const status = REQUEST_STATUS[req.status] ?? { label: req.status, color: "bg-gray-100" };
              return (
                <Card key={req.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{req.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {DOC_TYPES[req.type] || req.type}
                      </p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique ({processed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {processed.slice(0, 30).map((req) => {
              const status = REQUEST_STATUS[req.status] ?? { label: req.status, color: "bg-gray-100 text-gray-800" };
              return (
                <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{req.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {DOC_TYPES[req.type] || req.type} •{" "}
                      {new Date(req.createdAt).toLocaleString("fr-FR")}
                      {req.autoProcessed && " • Auto"}
                    </p>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
