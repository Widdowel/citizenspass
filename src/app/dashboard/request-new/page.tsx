"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

const docTypes = [
  { value: "BIRTH_CERTIFICATE", label: "Acte de naissance" },
  { value: "CRIMINAL_RECORD", label: "Casier judiciaire" },
  { value: "RESIDENCE_CERTIFICATE", label: "Certificat de residence" },
  { value: "NATIONALITY_CERTIFICATE", label: "Certificat de nationalite" },
  { value: "MARRIAGE_CERTIFICATE", label: "Acte de mariage" },
  { value: "DEATH_CERTIFICATE", label: "Acte de deces" },
  { value: "DRIVER_LICENSE", label: "Permis de conduire" },
  { value: "TAX_CERTIFICATE", label: "Attestation fiscale" },
];

export default function RequestNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formData.get("type"),
        reason: formData.get("reason"),
      }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/requests"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la demande.");
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="w-16 h-16 text-[#008751] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Demande envoyee !</h2>
            <p className="text-gray-500">
              Votre demande a ete soumise avec succes. Vous serez redirige...
            </p>
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
          Selectionnez le type de document et soumettez votre demande
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de demande</CardTitle>
          <CardDescription>
            Tous les champs marques sont obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type de document *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type de document" />
                </SelectTrigger>
                <SelectContent>
                  {docTypes.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif de la demande</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Decrivez la raison de votre demande (optionnel)"
                rows={4}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008751] hover:bg-[#006b41]"
            >
              {loading ? "Envoi en cours..." : "Soumettre la demande"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
