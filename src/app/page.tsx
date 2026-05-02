import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Globe,
  FileCheck,
  ArrowRight,
  FileText,
  Users,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Securise",
    desc: "Chaque document est signe numeriquement et verifiable par QR code.",
  },
  {
    icon: Zap,
    title: "Rapide",
    desc: "Demandez et recevez vos documents en quelques clics, sans file d'attente.",
  },
  {
    icon: Globe,
    title: "Accessible",
    desc: "Disponible 24h/24 depuis votre telephone ou ordinateur, partout dans le pays.",
  },
  {
    icon: FileCheck,
    title: "Officiel",
    desc: "Documents emis par les administrations competentes, legalement reconnus.",
  },
];

const stats = [
  { value: "125 000+", label: "Documents emis", icon: FileText },
  { value: "80 000+", label: "Citoyens inscrits", icon: Users },
  { value: "12", label: "Ministeres connectes", icon: Building2 },
];

const steps = [
  { num: "1", title: "Inscrivez-vous", desc: "Avec votre NIN et vos informations personnelles" },
  { num: "2", title: "Faites votre demande", desc: "Choisissez le document et remplissez le formulaire" },
  { num: "3", title: "Suivi en temps reel", desc: "Suivez l'avancement de votre demande" },
  { num: "4", title: "Telechargez", desc: "Recevez votre document officiel avec QR code" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#008751] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CitizenPass</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth">
              <Button variant="outline">Se connecter</Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-[#008751] hover:bg-[#006b41]">
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#008751]/5 via-white to-[#FCD116]/5 py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#008751]/10 text-[#008751] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Plateforme officielle du Benin
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Vos documents.{" "}
            <span className="text-[#008751]">Partout.</span>{" "}
            <span className="text-[#FCD116] drop-shadow-sm">Tout le temps.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Demandez, telechargez et verifiez vos documents administratifs
            officiels en ligne. Plus besoin de faire la queue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-[#008751] hover:bg-[#006b41] text-white px-8 h-12 text-base"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                Verifier un document
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#1E3A5F]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 text-[#FCD116] mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi <span className="text-[#008751]">CitizenPass</span> ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-[#008751]/10 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-[#008751]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comment ca marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#008751] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#008751]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pret a simplifier vos demarches ?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Rejoignez des milliers de citoyens qui utilisent deja CitizenPass.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-[#FCD116] text-[#1E3A5F] hover:bg-[#FCD116]/90 px-8 h-12 text-base font-semibold"
            >
              Creer mon compte gratuit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#008751] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">CitizenPass</span>
          </div>
          <p className="text-sm">
            &copy; 2026 CitizenPass — Republique du Benin. Tous droits reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}
