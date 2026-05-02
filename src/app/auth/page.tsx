"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function AuthPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Identifiant ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#008751]/5 via-white to-[#FCD116]/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[#008751] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connexion CitizenPass</CardTitle>
          <CardDescription>
            Connectez-vous avec votre Carte d&apos;Identité Personnelle (CIP)
            ou votre NIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">CIP ou NIN</Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="Ex: 1234-5678-9012 ou BEN-2024-XXXXXXXX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
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
              <Fingerprint className="w-4 h-4 mr-2" />
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">
              Comptes de démonstration :
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <span className="font-mono bg-gray-200 px-1 rounded">1234-5678-9012</span>{" "}
                / <span className="font-mono bg-gray-200 px-1 rounded">demo123</span>{" "}
                (Citoyen — Koffi Adégbola)
              </p>
              <p>
                <span className="font-mono bg-gray-200 px-1 rounded">2345-6789-0123</span>{" "}
                / <span className="font-mono bg-gray-200 px-1 rounded">demo123</span>{" "}
                (Citoyen — Adjoa Mensah)
              </p>
              <p>
                <span className="font-mono bg-gray-200 px-1 rounded">ADMIN-001</span>{" "}
                / <span className="font-mono bg-gray-200 px-1 rounded">admin123</span>{" "}
                (Administrateur)
              </p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-4">
            Hébergement souverain — République du Bénin. Loi 2009-09 sur la protection des données à caractère personnel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
