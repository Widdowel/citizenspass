"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Fingerprint, Smartphone, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { TricolorLogo, TricolorBar } from "@/components/tricolor";
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

type Step = "identifier" | "otp" | "password";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [phoneMask, setPhoneMask] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  async function requestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!identifier.trim()) return;
    setError("");
    setLoading(true);
    setDemoCode("");
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: identifier.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Erreur réseau. Réessayez.");
      return;
    }
    const data = await res.json();
    if (data.requiresPassword) {
      setStep("password");
      setPhoneMask(data.phoneMask ?? "");
      return;
    }
    if (!data.sent) {
      setError("Identifiant inconnu ou non enregistré à l'ANIP.");
      return;
    }
    setPhoneMask(data.phoneMask);
    if (data.demoCode) setDemoCode(data.demoCode);
    setResendIn(30);
    setStep("otp");
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (otp.length !== 6) return;
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      identifier: identifier.trim(),
      otp,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Code incorrect ou expiré.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Mot de passe incorrect.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#008751]/5 via-[#FAF7E8]/30 to-[#FCD116]/10">
      <TricolorBar variant="vertical" thickness="thin" />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <TricolorLogo size="xl" />
          </div>
          <CardTitle className="text-2xl">Connexion BJ PASS</CardTitle>
          <CardDescription>
            {step === "identifier" && "Saisissez votre Carte d'Identité Personnelle (CIP) ou votre carte de résident."}
            {step === "otp" && "Saisissez le code reçu par SMS sur le numéro déclaré à l'ANIP."}
            {step === "password" && "Compte administratif — utilisez votre mot de passe."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "identifier" && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">CIP ou Carte de résident</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex : 1234-5678-9012"
                  required
                  className="font-mono"
                />
                <p className="text-xs text-gray-400">
                  Le code de connexion sera envoyé par SMS au numéro de téléphone
                  déclaré lors de votre enrôlement à l&apos;ANIP.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008751] hover:bg-[#006b41]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi du code SMS...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Recevoir le code par SMS
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Code envoyé</p>
                    <p className="text-blue-700">
                      Un code à 6 chiffres a été envoyé au {phoneMask}.
                    </p>
                  </div>
                </div>
              </div>

              {demoCode && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm">
                  <p className="text-amber-900 text-xs uppercase font-bold tracking-wider">
                    Mode démonstration
                  </p>
                  <p className="text-amber-700 mt-1">
                    Code à saisir : <span className="font-mono font-bold text-lg">{demoCode}</span>
                  </p>
                  <p className="text-amber-600 text-xs mt-1">
                    En production, ce code arrive par SMS et n&apos;est jamais affiché ici.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Code à 6 chiffres</Label>
                <Input
                  ref={otpInputRef}
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#008751] hover:bg-[#006b41]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Valider
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identifier");
                    setOtp("");
                    setError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Changer d&apos;identifiant
                </button>
                <button
                  type="button"
                  disabled={resendIn > 0}
                  onClick={() => requestOtp()}
                  className="text-[#008751] hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendIn > 0 ? `Renvoyer dans ${resendIn}s` : "Renvoyer le code"}
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={loginWithPassword} className="space-y-4">
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-violet-700 mt-0.5 shrink-0" />
                  <p className="text-violet-900">
                    Compte administratif détecté. Mot de passe requis (l&apos;OTP SMS
                    n&apos;est utilisé que pour les citoyens).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-[#008751] hover:bg-[#006b41]">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("identifier");
                  setPassword("");
                  setError("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Changer d&apos;identifiant
              </button>
            </form>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">Comptes de démonstration :</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-mono bg-gray-200 px-1 rounded">1234-5678-9012</span> Koffi Adégbola — clean (CIP + OTP SMS démo)</p>
              <p><span className="font-mono bg-gray-200 px-1 rounded">3456-7890-1234</span> Yves Houngbédji — exception judiciaire</p>
              <p><span className="font-mono bg-gray-200 px-1 rounded">5678-9012-3456</span> Anatole Agbessi — extraction requise</p>
              <p><span className="font-mono bg-gray-200 px-1 rounded">ADMIN-001</span> / <span className="font-mono bg-gray-200 px-1 rounded">admin123</span> Admin</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-4">
            Hébergement souverain — République du Bénin. Loi 2009-09 sur la protection des données à caractère personnel.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
