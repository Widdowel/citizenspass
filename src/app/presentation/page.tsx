import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  TrendingUp,
  FileCheck2,
  Lock,
  Smartphone,
  Globe,
  Banknote,
  Scale,
  Receipt,
  CreditCard,
  Fingerprint,
  Database,
  Calendar,
  MapPin,
} from "lucide-react";
import { DOC_CATEGORIES, DOC_TYPES, DOC_AUTHORITY, AUTHORITIES, totalPrice } from "@/lib/constants";
import { TricolorLogo, TricolorBar } from "@/components/tricolor";

export const metadata = {
  title: "CitizenPass — Plateforme nationale de délivrance instantanée",
  description: "Document de présentation pour audiences institutionnelles",
};

function formatXOF(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

const navSections = [
  { id: "constat", label: "Constat" },
  { id: "probleme", label: "Problème" },
  { id: "solution", label: "Solution" },
  { id: "fonctionnement", label: "Fonctionnement" },
  { id: "documents", label: "Documents" },
  { id: "personas", label: "Cas d'usage" },
  { id: "securite", label: "Sécurité" },
  { id: "marche", label: "Marché" },
  { id: "modele", label: "Modèle économique" },
  { id: "phasage", label: "Phasage" },
  { id: "legal", label: "Cadre légal" },
];

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Bande tricolore signature */}
      <TricolorBar variant="vertical" thickness="thin" />

      {/* Navigation flottante */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <TricolorLogo size="sm" />
            <span className="font-bold">CitizenPass</span>
            <span className="text-xs text-gray-400 hidden sm:inline">— Présentation</span>
          </Link>
          <div className="hidden lg:flex gap-1 text-xs">
            {navSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="px-2.5 py-1 rounded text-gray-600 hover:bg-gray-100">
                {s.label}
              </a>
            ))}
          </div>
          <Link href="https://citizenspass.vercel.app/auth" target="_blank">
            <span className="text-xs bg-[#008751] text-white px-3 py-1.5 rounded font-medium">
              Démo live ↗
            </span>
          </Link>
        </div>
      </nav>

      {/* COVER */}
      <section className="bg-gradient-to-br from-[#008751] via-[#006b41] to-[#1E3A5F] text-white py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-6">
            <CheckCircle2 className="w-3 h-3" />
            Document de présentation institutionnelle — République du Bénin
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            CitizenPass
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 font-light mb-8 max-w-3xl">
            Plateforme nationale de délivrance instantanée des documents administratifs.
          </p>
          <p className="text-lg text-white/70 max-w-3xl mb-10">
            Une innovation souveraine béninoise. <strong>De plusieurs jours à quelques minutes</strong>, sans intervention humaine pour 95% des demandes, signature numérique cryptographique de l&apos;État, vérification publique.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded">📱 Mobile-first</span>
            <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded">🔐 Souverain (hébergement BJ)</span>
            <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded">⚡ Délivrance &lt; 90 sec</span>
            <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded">✍️ RSA-2048 / SHA-256</span>
            <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded">🇧🇯 Loi 2017-20 conforme</span>
          </div>
        </div>
      </section>

      {/* CONSTAT */}
      <Section id="constat" eyebrow="01 · Constat" title="L'administration béninoise a déjà numérisé ses bases — pas son guichet">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Le Bénin a fait depuis 2017 d&apos;immenses progrès sur la <strong>digitalisation</strong> :
              ANIP a enrôlé biométriquement plus de <strong>9 millions de personnes</strong>, le portail
              service-public.bj recense <strong>1 200+ démarches</strong>, la connectivité mobile dépasse
              les <strong>90% de la population</strong>.
            </p>
            <p className="text-lg text-gray-700">
              Pourtant, pour obtenir un acte de naissance ou un casier judiciaire, le citoyen attend toujours
              <strong> 2 jours à 1 mois</strong>, doit se déplacer plusieurs fois, et essuie des coûts cachés
              estimés au double du timbre officiel.
            </p>
          </div>
          <div className="bg-[#FAF7E8] rounded-2xl p-6 space-y-4 border border-[#FCD116]/30">
            <Stat icon={Users} value="13 M" label="population du Bénin" />
            <Stat icon={Smartphone} value="9 M+" label="citoyens enrôlés ANIP" />
            <Stat icon={Globe} value="90%+" label="couverture mobile" />
            <Stat icon={FileCheck2} value="~21 M" label="actes administratifs / an estimés" />
          </div>
        </div>
      </Section>

      {/* PROBLÈME */}
      <Section id="probleme" eyebrow="02 · Problème" title="Les délais ne viennent pas du manque d'information — ils viennent du transport humain de cette information" dark>
        <div className="grid md:grid-cols-3 gap-6">
          <Pain
            icon={Calendar}
            title="2 jours à 1 mois"
            desc="Délai moyen pour un casier judiciaire ou un acte d'état civil. Inadéquat aux urgences (concours, embauche, visa)."
          />
          <Pain
            icon={Banknote}
            title="Coûts cachés"
            desc="Le timbre officiel d'un acte est de 500-1000 FCFA. Le citoyen paie en réalité 2 à 5 fois plus (transport, attentes, pourboires)."
          />
          <Pain
            icon={AlertTriangle}
            title="Faux documents"
            desc="L'Étatperd des recettes fiscales et l'écosystème (banques, ambassades) souffre de la circulation de documents non authentifiables."
          />
          <Pain
            icon={MapPin}
            title="Fracture territoriale"
            desc="Un citoyen de Tanguiéta met une journée pour atteindre la mairie de naissance située dans une autre commune."
          />
          <Pain
            icon={Building2}
            title="Encombrement guichets"
            desc="Personnel mobilisé sur des tâches répétitives au lieu de se concentrer sur les vrais cas complexes."
          />
          <Pain
            icon={Receipt}
            title="Vérification opaque"
            desc="Banques, ambassades, employeurs : aucun moyen rapide et fiable de vérifier l'authenticité d'un document présenté."
          />
        </div>
      </Section>

      {/* SOLUTION */}
      <Section id="solution" eyebrow="03 · Solution" title="CitizenPass — l'orchestration numérique remplace le transport humain">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-lg text-gray-700 mb-4">
              <strong>L&apos;État dispose déjà des données.</strong> CitizenPass est l&apos;orchestrateur qui interroge automatiquement les bases natives (ANIP, Cour d&apos;Appel, DGI, mairies), génère le document signé cryptographiquement, et le délivre en quelques minutes — depuis l&apos;application mobile officielle sur le téléphone du citoyen.
            </p>
            <p className="text-lg text-gray-700">
              Le citoyen ne quitte JAMAIS l&apos;application. Le paiement, la régularisation fiscale, l&apos;authentification, la vérification — tout se passe dans CitizenPass.
            </p>
          </div>
          <div className="space-y-3">
            <Feature icon={Zap} title="Délivrance automatique 95%" desc="Pour la majorité des cas, aucune intervention humaine. Le pipeline traite tout en moins de 90 secondes." />
            <Feature icon={Lock} title="Signature cryptographique" desc="RSA-2048/SHA-256, vérifiable hors-ligne par n'importe qui via la clé publique de l'autorité émettrice." />
            <Feature icon={ShieldCheck} title="Souveraineté totale" desc="Hébergement physique au Bénin. Aucune donnée ne quitte le territoire. Conformité Loi 2017-20." />
            <Feature icon={Users} title="Vérification publique" desc="Banques, ambassades, employeurs vérifient un document en 2 secondes via QR ou API B2B sécurisée." />
          </div>
        </div>
      </Section>

      {/* FONCTIONNEMENT */}
      <Section id="fonctionnement" eyebrow="04 · Fonctionnement" title="Pipeline en 5 étapes — automatique et auditable">
        <div className="space-y-3">
          {[
            { num: "1", title: "Vérification d'identité ANIP", desc: "Authentification biométrique (FaceID/empreinte), match avec le gabarit ANIP du citoyen.", icon: Fingerprint },
            { num: "2", title: "Contrôle des sources natives", desc: "Lecture en temps réel des registres : état civil (mairie), casier (Cour d'Appel), fiscal (DGI), résidence.", icon: Database },
            { num: "3", title: "Génération du document officiel", desc: "Composition automatique selon le modèle réglementaire propre à chaque type de document.", icon: FileCheck2 },
            { num: "4", title: "Signature cryptographique", desc: "Signature RSA-2048 par la clé privée de l'autorité émettrice (Cour d'Appel, Mairie, DGI…).", icon: Lock },
            { num: "5", title: "Document délivré", desc: "PDF officiel téléchargeable, vérifiable hors-ligne, archivé dans le wallet du citoyen.", icon: CheckCircle2 },
          ].map((step) => (
            <div key={step.num} className="flex gap-4 p-5 bg-gray-50 rounded-xl items-start">
              <div className="w-12 h-12 rounded-xl bg-[#008751] text-white flex items-center justify-center font-bold text-lg shrink-0">
                {step.num}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <step.icon className="w-4 h-4 text-[#008751]" />
                  <h4 className="font-bold">{step.title}</h4>
                </div>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* DOCUMENTS */}
      <Section id="documents" eyebrow="05 · Documents intégrés" title="18 documents administratifs couvrant 90% des demandes citoyennes">
        <p className="text-lg text-gray-600 mb-8">
          Les types de documents listés ci-dessous sont déjà intégrés dans la démo live. Architecture extensible : tout nouveau document se ramène à 4 paramètres (autorité, format PDF, vérifications, tarif).
        </p>
        <div className="space-y-8">
          {Object.entries(DOC_CATEGORIES).map(([catKey, cat]) => (
            <div key={catKey}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#008751] mb-3">
                {cat.label}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.types.map((type) => {
                  const auth = AUTHORITIES[DOC_AUTHORITY[type]];
                  return (
                    <div key={type} className="border border-gray-200 rounded-lg p-3 hover:border-[#008751]/40 transition-colors">
                      <div className="font-medium text-sm">{DOC_TYPES[type]}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{auth?.shortName}</div>
                      <div className="text-xs font-mono text-[#008751] mt-1">
                        {formatXOF(totalPrice(type))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PERSONAS */}
      <Section id="personas" eyebrow="06 · Cas d'usage" title="3 parcours citoyens représentatifs" dark>
        <div className="grid md:grid-cols-3 gap-6">
          <Persona
            name="Koffi Adégbola, 32 ans"
            location="Cotonou"
            scenario="Demande son acte de naissance pour un dossier d'embauche."
            outcome="Connecté en 30 secondes (CIP + OTP SMS). Paiement 550 FCFA via BJ Pay. PDF officiel signé reçu en moins de 90 secondes. Total : moins de 3 minutes pour ce qui prenait 3 jours auparavant."
            color="green"
          />
          <Persona
            name="Yves Houngbédji, 47 ans"
            location="Parakou"
            scenario="Demande un casier judiciaire mais a une procédure en cours."
            outcome="Le système détecte automatiquement la procédure. Au lieu de devoir aller au greffe, il paye 5 000 FCFA de frais de revue dans l'app, joint un commentaire. Le greffier valide en quelques heures depuis son tableau de bord. Casier délivré sans déplacement."
            color="violet"
          />
          <Persona
            name="Fatouma Bio Sani, 23 ans"
            location="Natitingou"
            scenario="Demande un quitus fiscal mais a une dette de 25 000 FCFA."
            outcome="Le système affiche la dette. Elle paie via Mobile Money depuis l'app. Régularisation INSTANTANÉE — le quitus est généré automatiquement en 5 secondes. Aucun agent DGI n'a eu à intervenir."
            color="blue"
          />
        </div>
      </Section>

      {/* SÉCURITÉ */}
      <Section id="securite" eyebrow="07 · Sécurité" title="Données hyper-sensibles, protection multi-couches">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { t: "Souveraineté physique", d: "Hébergement au Bénin (datacenter ASIN). Aucune donnée ne quitte le territoire." },
            { t: "Signature RSA-2048 / SHA-256", d: "Chaque document est signé par la clé privée de l'autorité émettrice (3 autorités distinctes)." },
            { t: "Clés privées chiffrées AES-256-GCM", d: "Production : HSM FIPS 140-2 niveau 3. Démo : KEK dérivée scrypt." },
            { t: "Authentification ANIP réelle", d: "CIP + OTP SMS. Aucun mot de passe partagé. Bcrypt + verrouillage 5 essais." },
            { t: "Audit log en chaîne de hash WORM", d: "Chaque action est journalisée avec hash chaîné. Toute altération est détectable." },
            { t: "Vérification publique cryptographique", d: "QR code → page de vérification avec validation crypto complète, sans révéler les données personnelles." },
            { t: "Rate limiting + headers de sécurité", d: "Anti-bruteforce, CSP, HSTS, X-Frame-Options, Permissions-Policy." },
            { t: "API B2B sécurisée", d: "Clés API hashées en DB, mTLS prévu en production, signature des requêtes." },
            { t: "Verifiable Attributes", d: "Une banque vérifie 'majeur + casier vierge' sans recevoir le PDF complet — réponse signée par l'État." },
            { t: "Conformité Loi 2009-09", d: "Protection des données personnelles. APDP comme autorité de contrôle." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#008751] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">{item.t}</div>
                <div className="text-xs text-gray-600 mt-0.5">{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* MARCHÉ */}
      <Section id="marche" eyebrow="08 · Marché" title="Volume et potentiel financier" dark>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <BigStat value="~21 M" label="actes administratifs / an" sub="(3 actes × 7 M adultes)" />
          <BigStat value="~14,7 Mds" label="FCFA / an de marché direct" sub="(actes × 700 FCFA moyens)" />
          <BigStat value="~105 Mds" label="FCFA / an d'économies citoyennes" sub="(temps & déplacements évités)" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#008751]" />
              Marché B2B (vérifications)
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>→ Banques : ~10-15 000 KYC / jour cumulés (50+ établissements)</li>
              <li>→ Assurances, télécoms, employeurs, ambassades, tribunaux commerce</li>
              <li>→ <strong>~5-10 millions de vérifications / an</strong></li>
              <li>→ Tarif modèle : 200-500 FCFA / requête</li>
              <li>→ Marché : <strong>1 à 5 milliards FCFA / an</strong></li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#008751]" />
              Économies pour l&apos;État
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>→ Réduction massive du personnel guichet</li>
              <li>→ Lutte contre les faux documents (estimés à 5-15% des actes en circulation)</li>
              <li>→ Recouvrement fiscal accru (régularisation in-app friction zéro)</li>
              <li>→ Image de l&apos;administration et attractivité économique</li>
              <li>→ <strong>Estimation conservatrice : 8-20 milliards FCFA / an</strong></li>
            </ul>
          </div>
        </div>
      </Section>

      {/* MODÈLE ÉCONOMIQUE */}
      <Section id="modele" eyebrow="09 · Modèle économique" title="Auto-financement par les frais de service">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <h4 className="font-bold text-emerald-900 mb-3">Pour le citoyen</h4>
            <ul className="space-y-2 text-sm text-emerald-900">
              <li>✓ Le timbre fiscal officiel reste inchangé (recette État)</li>
              <li>✓ Frais de service CitizenPass : <strong>50-100 FCFA / acte</strong> (vs. coûts cachés actuels de 1000-3000 FCFA)</li>
              <li>✓ Aucun déplacement, aucune attente</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-blue-900 mb-3">Pour l&apos;État + opérateur</h4>
            <ul className="space-y-2 text-sm text-blue-900">
              <li>✓ État : 100% du timbre + part des frais de service</li>
              <li>✓ Opérateur : marge sur frais de service + revenus B2B (vérifications)</li>
              <li>✓ Rentabilité atteinte dès 5-10% du marché national capté</li>
              <li>✓ Investissement initial estimé : <strong>1,5-3 milliards FCFA</strong> (infra souveraine + dev + audit + lancement)</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* PHASAGE */}
      <Section id="phasage" eyebrow="10 · Phasage" title="Du pilote à la généralisation en 18 mois" dark>
        <div className="space-y-4">
          <Phase
            n="0"
            title="Démo institutionnelle"
            duration="2-4 semaines (en cours)"
            desc="Plateforme fonctionnelle de bout en bout (déjà déployée — citizenspass.vercel.app) avec données simulées mais cryptographie réelle. Pour audiences ASIN, Présidence, Ministères, Mairies."
          />
          <Phase
            n="1"
            title="Pilote technique"
            duration="3 mois"
            desc="Intégration ANIP (sandbox) + 1 document en production restreinte (ex: casier judiciaire à Cotonou). 1000 citoyens pilotes. Audit sécurité tiers."
          />
          <Phase
            n="2"
            title="Pilote géographique"
            duration="6 mois"
            desc="3 documents prioritaires sur 1 département (Littoral). Tous les citoyens volontaires. Mesure : délai moyen, satisfaction, fraude détectée."
          />
          <Phase
            n="3"
            title="Généralisation nationale"
            duration="12 mois"
            desc="18+ documents, couverture nationale, app mobile native iOS/Android, API B2B ouverte aux institutions, intégration avec service-public.bj."
          />
        </div>
      </Section>

      {/* CADRE LÉGAL */}
      <Section id="legal" eyebrow="11 · Cadre légal" title="Conformité totale au droit béninois">
        <div className="grid md:grid-cols-2 gap-6">
          <Legal
            title="Loi 2017-20 — Code numérique du Bénin"
            desc="Reconnaît la signature électronique et le document numérique avec la même valeur que le papier. CitizenPass s'inscrit nativement dans ce cadre."
          />
          <Legal
            title="Loi 2009-09 — Protection des données"
            desc="L'APDP est l'autorité de contrôle. Hébergement souverain, journal d'accès consultable par le citoyen, droit à l'oubli respecté."
          />
          <Legal
            title="Code de procédure pénale"
            desc="Le casier judiciaire reste émis par la Cour d'Appel. CitizenPass est un guichet d'orchestration, pas une autorité émettrice. La signature crypto est apposée par la clé de la Cour."
          />
          <Legal
            title="Code de l'état civil"
            desc="Les actes restent certifiés par la mairie de naissance/résidence. CitizenPass automatise la délivrance, l'autorité reste la mairie."
          />
        </div>
        <div className="mt-8 bg-gray-50 rounded-xl p-6 text-sm text-gray-700">
          <strong className="block mb-2">Modèle institutionnel proposé :</strong>
          <ul className="space-y-1">
            <li>→ <strong>Maître d&apos;ouvrage :</strong> ASIN (Agence des Systèmes d&apos;Information et du Numérique) ou Présidence</li>
            <li>→ <strong>Autorités émettrices :</strong> Ministère de la Justice, Ministère de l&apos;Intérieur, DGI, Mairies</li>
            <li>→ <strong>Autorité de contrôle :</strong> APDP (Autorité de Protection des Données Personnelles)</li>
            <li>→ <strong>Opérateur :</strong> ASIN ou DPP avec un partenaire technique</li>
          </ul>
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-[#1E3A5F] via-[#008751] to-[#006b41] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prochaine étape
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Rendez-vous de cadrage avec ASIN, Présidence, Ministère du Numérique, Mairies pour valider le périmètre du pilote technique (Phase 1).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://citizenspass.vercel.app/auth" target="_blank">
              <span className="inline-block bg-[#FCD116] text-[#1E3A5F] px-8 py-4 rounded-lg font-bold text-base">
                Lancer la démo live
                <ArrowRight className="inline ml-2 w-4 h-4" />
              </span>
            </Link>
            <Link href="https://citizenspass.vercel.app/demo/verify-citizen" target="_blank">
              <span className="inline-block bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-lg font-bold text-base">
                Démo banque (vérification B2B)
              </span>
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-12">
            CitizenPass — République du Bénin · Souveraineté numérique · Document de présentation v1
          </p>
        </div>
      </section>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
  dark,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section id={id} className={`py-20 px-4 ${dark ? "bg-[#FAF7E8]" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-wider text-[#008751] mb-3">{eyebrow}</div>
        <h2 className="text-3xl md:text-5xl font-bold mb-10 max-w-4xl leading-tight">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#FCD116] flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-[#1E3A5F]" />
      </div>
      <div>
        <div className="font-bold text-lg">{value}</div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function Pain({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof AlertTriangle;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <Icon className="w-6 h-6 text-orange-600 mb-3" />
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 p-4 border border-gray-200 rounded-lg">
      <Icon className="w-5 h-5 text-[#008751] shrink-0 mt-0.5" />
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function Persona({
  name,
  location,
  scenario,
  outcome,
  color,
}: {
  name: string;
  location: string;
  scenario: string;
  outcome: string;
  color: "green" | "blue" | "violet";
}) {
  const colorMap = {
    green: "border-emerald-300 bg-white",
    blue: "border-blue-300 bg-white",
    violet: "border-violet-300 bg-white",
  };
  return (
    <div className={`rounded-xl p-5 border-2 ${colorMap[color]}`}>
      <div className="font-bold mb-1">{name}</div>
      <div className="text-xs text-gray-500 mb-3">{location}</div>
      <div className="text-sm text-gray-700 mb-3 italic border-l-2 border-gray-300 pl-3">
        {scenario}
      </div>
      <div className="text-sm text-gray-800">{outcome}</div>
    </div>
  );
}

function BigStat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="text-center bg-white rounded-2xl p-6 border-2 border-[#FCD116]/40 shadow-sm">
      <div className="text-5xl font-bold text-[#008751]" style={{ textShadow: "2px 2px 0 #FCD116" }}>
        {value}
      </div>
      <div className="text-base font-semibold mt-3">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

function Phase({
  n,
  title,
  duration,
  desc,
}: {
  n: string;
  title: string;
  duration: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 p-5 bg-white rounded-xl items-start border border-gray-200">
      <div className="w-12 h-12 rounded-xl bg-[#1E3A5F] text-white flex items-center justify-center font-bold text-xl shrink-0">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-3 mb-1">
          <h4 className="font-bold">{title}</h4>
          <span className="text-xs text-gray-500">— {duration}</span>
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function Legal({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-l-4 border-[#008751] pl-4 py-2">
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function _icons() {
  return [Building2, Scale, Receipt, CreditCard];
}
