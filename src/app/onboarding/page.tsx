"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  CreditCard,
  Camera,
  Fingerprint,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { TricolorLogo, TricolorBar } from "@/components/tricolor";

type Step = "intro" | "cip" | "scan" | "selfie" | "phone" | "success";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [cip, setCip] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [selfieProgress, setSelfieProgress] = useState(0);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [phoneMask, setPhoneMask] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function next(s: Step) {
    setStep(s);
  }

  // Animation scan CIP
  useEffect(() => {
    if (step !== "scan") return;
    setScanProgress(0);
    const id = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(() => next("selfie"), 600);
          return 100;
        }
        return p + 5;
      });
    }, 80);
    return () => clearInterval(id);
  }, [step]);

  // Animation selfie + match
  useEffect(() => {
    if (step !== "selfie") return;
    setSelfieProgress(0);
    setMatchScore(null);
    const id = setInterval(() => {
      setSelfieProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          // Score simulé entre 96.5 et 99.2
          const score = 96.5 + Math.random() * 2.7;
          setMatchScore(parseFloat(score.toFixed(1)));
          setTimeout(() => requestPhone(), 1200);
          return 100;
        }
        return p + 4;
      });
    }, 70);
    return () => clearInterval(id);
  }, [step]);

  async function requestPhone() {
    if (!cip) return;
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: cip }),
    });
    if (!res.ok) {
      setError("Erreur lors de l'envoi du code");
      next("cip");
      return;
    }
    const data = await res.json();
    if (data.requiresPassword) {
      // Compte admin — on redirige vers /auth
      router.push(`/auth?identifier=${encodeURIComponent(cip)}`);
      return;
    }
    if (!data.sent) {
      setError("CIP introuvable au registre national. Vérifiez votre saisie.");
      next("cip");
      return;
    }
    setPhoneMask(data.phoneMask);
    if (data.demoCode) setDemoCode(data.demoCode);
    next("phone");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    setError("");
    const result = await signIn("credentials", {
      identifier: cip.trim(),
      otp,
      redirect: false,
    });
    setSubmitting(false);
    if (result?.error) {
      setError("Code incorrect ou expiré.");
      return;
    }
    next("success");
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#008751]/5 via-[#FAF7E8]/30 to-[#FCD116]/10 flex flex-col">
      <TricolorBar variant="vertical" thickness="thin" />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        {step !== "intro" && step !== "success" && (
          <div className="flex items-center gap-2 mb-6 justify-center">
            {(["cip", "scan", "selfie", "phone"] as const).map((s, i) => {
              const order = ["cip", "scan", "selfie", "phone"];
              const currentIdx = order.indexOf(step as string);
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${
                      done
                        ? "bg-[#008751] text-white ring-[#008751]"
                        : active
                        ? "bg-[#FCD116] text-[#1E3A5F] ring-[#FCD116]"
                        : "bg-gray-200 text-gray-400 ring-transparent"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 3 && <div className={`w-8 h-0.5 ${done ? "bg-[#008751]" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* INTRO */}
        {step === "intro" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <TricolorLogo size="xl" />
              </div>
              <CardTitle className="text-2xl">Bienvenue sur BJ PASS</CardTitle>
              <CardDescription className="text-base">
                Activons votre identité numérique en 4 étapes simples.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <OnboardingStep n="1" icon={CreditCard} title="Saisissez votre CIP" desc="Le numéro de votre Carte d'Identité Personnelle ANIP" />
                <OnboardingStep n="2" icon={ScanLine} title="Scan de la CIP" desc="Validation des données par lecture optique" />
                <OnboardingStep n="3" icon={Camera} title="Selfie biométrique" desc="Match avec le gabarit ANIP enrôlé (FaceID)" />
                <OnboardingStep n="4" icon={Smartphone} title="Code OTP" desc="Vérification du numéro de téléphone enregistré" />
              </div>
              <Button
                onClick={() => next("cip")}
                className="w-full bg-[#008751] hover:bg-[#006b41] h-11 mt-4"
              >
                Commencer l&apos;activation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-xs text-center text-gray-400">
                Vous avez déjà un compte ?{" "}
                <Link href="/auth" className="text-[#008751] hover:underline">
                  Connectez-vous directement
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* CIP */}
        {step === "cip" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 1 — Votre CIP</CardTitle>
              <CardDescription>
                Saisissez le numéro figurant sur votre Carte d&apos;Identité Personnelle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cip-input">CIP</Label>
                <Input
                  id="cip-input"
                  value={cip}
                  onChange={(e) => setCip(e.target.value)}
                  placeholder="1234-5678-9012"
                  className="font-mono mt-1 text-center text-lg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format : XXXX-XXXX-XXXX (12 chiffres + tirets)
                </p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <Button
                onClick={() => {
                  setError("");
                  if (!cip.trim()) {
                    setError("Saisissez votre CIP");
                    return;
                  }
                  next("scan");
                }}
                className="w-full bg-[#008751] hover:bg-[#006b41]"
              >
                Continuer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SCAN */}
        {step === "scan" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 2 — Scan de la CIP</CardTitle>
              <CardDescription>
                Approchez votre CIP de la caméra, maintenez-la stable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-xl overflow-hidden aspect-[1.6/1] relative">
                {/* Carte simulée */}
                <div className="absolute inset-6 bg-gradient-to-br from-[#008751] to-[#1E3A5F] rounded-lg flex flex-col justify-between p-4 border border-white/30">
                  <div className="text-white/80 text-[10px] uppercase tracking-wider">
                    République du Bénin · ANIP
                  </div>
                  <div>
                    <div className="font-mono text-white text-base font-bold">{cip || "1234-5678-9012"}</div>
                    <div className="text-white/70 text-xs">Carte d&apos;Identité Personnelle</div>
                  </div>
                </div>
                {/* Ligne de scan */}
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FCD116] to-transparent shadow-lg"
                  style={{ top: `${scanProgress}%`, transition: "top 0.08s linear" }}
                />
                {/* Coins d'alignement */}
                {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((c, i) => (
                  <div key={i} className={`absolute w-5 h-5 border-[#FCD116] ${c}`} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-medium">
                  {scanProgress < 100 ? "Lecture optique en cours..." : "Données extraites ✓"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Vérification : photo, MRZ, intégrité, signature ANIP
                </p>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008751] transition-all"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SELFIE */}
        {step === "selfie" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 3 — Reconnaissance faciale</CardTitle>
              <CardDescription>
                Centrez votre visage. Tournez doucement la tête à gauche puis à droite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl aspect-square relative overflow-hidden">
                {/* Cercle de viseur */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-56 h-56 rounded-full border-4 transition-all"
                    style={{
                      borderColor: matchScore !== null ? "#10b981" : "#FCD116",
                      animation: matchScore === null ? "pulse 1.5s infinite" : "none",
                    }}
                  />
                </div>
                {/* Avatar simulé */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-orange-400 to-amber-700 flex items-center justify-center text-6xl font-bold text-white/90">
                    👤
                  </div>
                </div>
                {/* Overlay résultat */}
                {matchScore !== null && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      Match ANIP confirmé
                    </div>
                    <div className="text-white text-2xl font-bold mt-1">{matchScore}%</div>
                    <div className="text-white/70 text-xs">de similarité avec le gabarit enrôlé</div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008751] transition-all"
                    style={{ width: `${selfieProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {selfieProgress < 100 && "Détection liveness · Comparaison gabarit ANIP"}
                  {selfieProgress >= 100 && matchScore === null && "Calcul du score..."}
                  {matchScore !== null && "Identité vérifiée — récupération du numéro de téléphone"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PHONE */}
        {step === "phone" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 4 — Vérification du numéro</CardTitle>
              <CardDescription>
                Un code à 6 chiffres a été envoyé au numéro déclaré à l&apos;ANIP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Code envoyé</p>
                      <p className="text-blue-700">SMS au {phoneMask}</p>
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
                  </div>
                )}

                <div>
                  <Label htmlFor="otp">Code OTP</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono mt-1"
                    placeholder="——————"
                  />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || submitting}
                  className="w-full bg-[#008751] hover:bg-[#006b41]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activation...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Activer mon BJ PASS
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <Card className="border-emerald-200">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">BJ PASS activé !</h2>
              <p className="text-gray-500 mb-6">
                Votre identité numérique est prête. Redirection vers votre wallet...
              </p>
              <Loader2 className="w-5 h-5 animate-spin text-[#008751] mx-auto" />
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}

function OnboardingStep({
  n,
  icon: Icon,
  title,
  desc,
}: {
  n: string;
  icon: typeof CreditCard;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
      <div className="w-9 h-9 rounded-full bg-[#008751] text-white flex items-center justify-center font-bold text-sm shrink-0">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#008751]" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
