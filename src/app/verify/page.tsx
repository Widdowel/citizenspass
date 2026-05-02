"use client";

import { useState } from "react";
import { ShieldCheck, Search, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type VerifyResult = {
  valid: boolean;
  document?: {
    title: string;
    type: string;
    issuedAt: string;
    userName: string;
  };
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/documents/verify?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#008751]/5 via-white to-[#FCD116]/5">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#008751] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CitizenPass</span>
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verification de document
          </h1>
          <p className="text-gray-500">
            Entrez le code QR pour verifier l&apos;authenticite d&apos;un document
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Code de verification</CardTitle>
            <CardDescription>
              Le code se trouve en bas de chaque document officiel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code QR / Reference</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: DOC-XXXX-XXXX-XXXX"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008751] hover:bg-[#006b41]"
              >
                {loading ? "Verification..." : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Verifier
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6">
                {result.valid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-green-700">
                        Document valide
                      </span>
                    </div>
                    <div className="text-sm space-y-1 text-green-800">
                      <p><strong>Titre :</strong> {result.document?.title}</p>
                      <p><strong>Type :</strong> {result.document?.type}</p>
                      <p><strong>Titulaire :</strong> {result.document?.userName}</p>
                      <p>
                        <strong>Date d&apos;emission :</strong>{" "}
                        {result.document?.issuedAt &&
                          new Date(result.document.issuedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-semibold text-red-700">
                        Document non trouve ou invalide
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-2">
                      Ce code ne correspond a aucun document dans notre systeme.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
