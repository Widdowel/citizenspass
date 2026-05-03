"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scale, Loader2, CheckCircle2, XCircle, Clock, User } from "lucide-react";

type Item = {
  id: string;
  type: string;
  amount: number;
  citizenComment: string | null;
  reviewerNote: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  request: {
    id: string;
    type: string;
    user: {
      name: string;
      cip: string;
      registry: { judicialDetails: string | null } | null;
    };
  };
};

export default function AdminGreffePage() {
  const [pending, setPending] = useState<Item[]>([]);
  const [recent, setRecent] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/greffe");
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending);
      setRecent(data.recent);
    }
    setLoading(false);
  }

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    const note = notes[id] ?? "";
    if (decision === "REJECTED" && !note.trim()) {
      alert("Une note expliquant le rejet est requise");
      return;
    }
    setSubmitting(id);
    await fetch(`/api/admin/greffe/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    setSubmitting(null);
    await load();
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
          <Scale className="w-6 h-6 text-violet-700" />
          Greffe — Demandes de revue judiciaire
        </h1>
        <p className="text-gray-500 mt-1">
          Cour d&apos;Appel de Cotonou. Validation rapide des demandes de levée d&apos;exception
          judiciaire.
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-yellow-600" />
        En attente de décision ({pending.length})
      </h2>

      {pending.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-gray-400">
            Aucune demande en attente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map((p) => (
            <Card key={p.id} className="border-violet-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-violet-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.request.user.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        CIP {p.request.user.cip}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-violet-100 text-violet-800">
                    {p.amount.toLocaleString("fr-FR")} FCFA payés
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {p.request.user.registry?.judicialDetails && (
                  <div className="bg-gray-50 border-l-4 border-gray-300 p-3 text-sm">
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                      Mention au registre national
                    </div>
                    <div className="text-gray-700">{p.request.user.registry.judicialDetails}</div>
                  </div>
                )}

                {p.citizenComment && (
                  <div className="bg-blue-50 border-l-4 border-blue-300 p-3 text-sm">
                    <div className="text-xs uppercase font-semibold text-blue-700 mb-1">
                      Commentaire du citoyen
                    </div>
                    <div className="text-blue-900">{p.citizenComment}</div>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Soumise le {new Date(p.createdAt).toLocaleString("fr-FR")}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Note de décision (obligatoire en cas de rejet)
                  </label>
                  <Textarea
                    value={notes[p.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    placeholder="Ex : Procédure n°2024/X classée sans suite le ../../, casier vierge confirmé."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => decide(p.id, "REJECTED")}
                    disabled={submitting === p.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter (procédure maintenue)
                  </Button>
                  <Button
                    onClick={() => decide(p.id, "APPROVED")}
                    disabled={submitting === p.id}
                    className="bg-[#008751] hover:bg-[#006b41]"
                  >
                    {submitting === p.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validation...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Valider — Casier vierge
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Historique récent</h2>
      {recent.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-gray-400 text-sm">
            Pas d&apos;historique.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{p.request.user.name}</div>
                  <div className="text-xs text-gray-500">
                    {p.reviewedAt && new Date(p.reviewedAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <Badge
                  className={
                    p.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {p.status === "APPROVED" ? "Validé" : "Rejeté"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
