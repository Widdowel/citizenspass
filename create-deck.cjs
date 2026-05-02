const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icon imports
const {
  FaShieldAlt, FaClock, FaUsers, FaFileAlt, FaGlobe, FaLock,
  FaCheckCircle, FaMobileAlt, FaDatabase, FaServer, FaChartLine,
  FaHandshake, FaRocket, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaExclamationTriangle, FaLightbulb, FaCogs, FaCalendarAlt,
  FaMoneyBillWave, FaUserTie, FaQrcode, FaBell
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Colors
const GREEN = "008751";
const YELLOW = "FCD116";
const RED = "E8112D";
const BLUE = "1E3A5F";
const WHITE = "FFFFFF";
const LIGHT_BG = "F8FAFB";
const DARK_TEXT = "1A1A2E";
const GRAY = "6B7280";
const LIGHT_GREEN = "E8F5E9";

const makeShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.12 });

async function createDeck() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "CitizenPass";
  pres.title = "CitizenPass - Pitch Deck";

  // ============== SLIDE 1: COVER ==============
  let s1 = pres.addSlide();
  s1.background = { color: BLUE };

  // Green accent bar top
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });
  // Yellow accent bar below
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.06, w: 10, h: 0.03, fill: { color: YELLOW } });

  const shieldIcon = await iconToBase64Png(FaShieldAlt, "#FFFFFF", 256);
  s1.addImage({ data: shieldIcon, x: 4.25, y: 0.7, w: 0.7, h: 0.7 });

  // Green circle behind icon
  s1.addShape(pres.shapes.OVAL, { x: 4.05, y: 0.5, w: 1.1, h: 1.1, fill: { color: GREEN } });
  s1.addImage({ data: shieldIcon, x: 4.25, y: 0.7, w: 0.7, h: 0.7 });

  s1.addText("CitizenPass", {
    x: 0.5, y: 1.8, w: 9, h: 0.9,
    fontSize: 48, fontFace: "Georgia", bold: true, color: WHITE,
    align: "center", charSpacing: 4
  });

  s1.addText("Vos documents. Partout. Tout le temps.", {
    x: 0.5, y: 2.7, w: 9, h: 0.6,
    fontSize: 22, fontFace: "Calibri", color: YELLOW,
    align: "center", italic: true
  });

  // Separator line
  s1.addShape(pres.shapes.LINE, { x: 3.5, y: 3.5, w: 3, h: 0, line: { color: GREEN, width: 2 } });

  s1.addText("Plateforme nationale de dematerialisation\ndes documents administratifs", {
    x: 1, y: 3.7, w: 8, h: 0.8,
    fontSize: 14, fontFace: "Calibri", color: "CADCFC",
    align: "center", lineSpacing: 22
  });

  s1.addText("Republique du Benin", {
    x: 1, y: 4.7, w: 8, h: 0.5,
    fontSize: 13, fontFace: "Calibri", color: "CADCFC",
    align: "center", charSpacing: 3
  });

  // Bottom green bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.37, w: 10, h: 0.25, fill: { color: GREEN } });

  // ============== SLIDE 2: LE PROBLEME ==============
  let s2 = pres.addSlide();
  s2.background = { color: WHITE };
  s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: RED } });

  s2.addText("Le Probleme", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: RED, margin: 0
  });

  s2.addText("L'administration papier coute cher aux citoyens et a l'Etat", {
    x: 0.7, y: 0.95, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: GRAY, margin: 0
  });

  const problems = [
    { icon: FaClock, title: "Files d'attente", desc: "Des heures perdues devant les guichets pour un simple document" },
    { icon: FaFileAlt, title: "Documents perdus", desc: "Deterioration, perte de dossiers, pas de copies numeriques" },
    { icon: FaExclamationTriangle, title: "Corruption", desc: "Intermediaires non officiels, frais supplementaires illegaux" },
    { icon: FaMoneyBillWave, title: "Cout eleve", desc: "Transports, frais multiples, journees de travail perdues" },
    { icon: FaLock, title: "Manque de transparence", desc: "Aucune visibilite sur l'avancement des demandes" },
  ];

  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    const y = 1.6 + i * 0.78;
    const iconData = await iconToBase64Png(p.icon, "#" + RED, 256);

    s2.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y, w: 8.6, h: 0.68,
      fill: { color: "FEF2F2" },
      shadow: makeShadow()
    });
    s2.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y, w: 0.06, h: 0.68,
      fill: { color: RED }
    });
    s2.addImage({ data: iconData, x: 1.05, y: y + 0.14, w: 0.4, h: 0.4 });
    s2.addText(p.title, {
      x: 1.65, y, w: 2.5, h: 0.68,
      fontSize: 14, fontFace: "Calibri", bold: true, color: DARK_TEXT,
      valign: "middle", margin: 0
    });
    s2.addText(p.desc, {
      x: 4.2, y, w: 5, h: 0.68,
      fontSize: 12, fontFace: "Calibri", color: GRAY,
      valign: "middle", margin: 0
    });
  }

  // ============== SLIDE 3: LA SOLUTION ==============
  let s3 = pres.addSlide();
  s3.background = { color: BLUE };
  s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s3.addText("La Solution", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: WHITE, margin: 0
  });

  const lightbulb = await iconToBase64Png(FaLightbulb, "#FCD116", 256);
  s3.addImage({ data: lightbulb, x: 4.35, y: 1.3, w: 0.8, h: 0.8 });

  s3.addText("CitizenPass", {
    x: 1, y: 2.2, w: 8, h: 0.7,
    fontSize: 32, fontFace: "Georgia", bold: true, color: YELLOW,
    align: "center"
  });

  s3.addText("Une plateforme unique pour demander, telecharger\net verifier ses documents administratifs officiels\nen ligne, 24h/24, depuis n'importe ou.", {
    x: 1.5, y: 3, w: 7, h: 1,
    fontSize: 16, fontFace: "Calibri", color: "CADCFC",
    align: "center", lineSpacing: 24
  });

  // Key benefits row
  const benefits = [
    { icon: FaClock, label: "24h/24" },
    { icon: FaMobileAlt, label: "Mobile" },
    { icon: FaShieldAlt, label: "Securise" },
    { icon: FaQrcode, label: "Verifiable" },
  ];

  for (let i = 0; i < benefits.length; i++) {
    const b = benefits[i];
    const x = 1.2 + i * 2.1;
    s3.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 4.1, w: 0.7, h: 0.7, fill: { color: GREEN } });
    const bIcon = await iconToBase64Png(b.icon, "#FFFFFF", 256);
    s3.addImage({ data: bIcon, x: x + 0.43, y: 4.23, w: 0.44, h: 0.44 });
    s3.addText(b.label, {
      x, y: 4.85, w: 1.3, h: 0.4,
      fontSize: 12, fontFace: "Calibri", color: "CADCFC",
      align: "center"
    });
  }

  // ============== SLIDE 4: COMMENT CA MARCHE ==============
  let s4 = pres.addSlide();
  s4.background = { color: LIGHT_BG };
  s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s4.addText("Comment ca marche ?", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  s4.addText("4 etapes simples pour obtenir vos documents", {
    x: 0.7, y: 0.95, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: GRAY, margin: 0
  });

  const stepsData = [
    { num: "1", icon: FaUsers, title: "Inscrivez-vous", desc: "Avec votre NIN et vos informations personnelles" },
    { num: "2", icon: FaFileAlt, title: "Faites votre demande", desc: "Choisissez le document et remplissez le formulaire" },
    { num: "3", icon: FaClock, title: "Suivi en temps reel", desc: "Suivez l'avancement de votre demande" },
    { num: "4", icon: FaQrcode, title: "Telechargez", desc: "Recevez votre document officiel avec QR code" },
  ];

  for (let i = 0; i < stepsData.length; i++) {
    const step = stepsData[i];
    const x = 0.5 + i * 2.35;

    s4.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.6, w: 2.1, h: 3.2,
      fill: { color: WHITE },
      shadow: makeShadow()
    });
    s4.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.6, w: 2.1, h: 0.06,
      fill: { color: GREEN }
    });

    s4.addShape(pres.shapes.OVAL, {
      x: x + 0.65, y: 1.9, w: 0.8, h: 0.8,
      fill: { color: GREEN }
    });
    s4.addText(step.num, {
      x: x + 0.65, y: 1.9, w: 0.8, h: 0.8,
      fontSize: 28, fontFace: "Georgia", bold: true, color: WHITE,
      align: "center", valign: "middle"
    });

    s4.addText(step.title, {
      x: x + 0.1, y: 2.95, w: 1.9, h: 0.5,
      fontSize: 14, fontFace: "Calibri", bold: true, color: DARK_TEXT,
      align: "center"
    });

    s4.addText(step.desc, {
      x: x + 0.15, y: 3.45, w: 1.8, h: 0.9,
      fontSize: 11, fontFace: "Calibri", color: GRAY,
      align: "center"
    });

    if (i < 3) {
      s4.addText("→", {
        x: x + 2.1, y: 2.1, w: 0.25, h: 0.5,
        fontSize: 24, color: GREEN, align: "center", valign: "middle"
      });
    }
  }

  // ============== SLIDE 5: FONCTIONNALITES ==============
  let s5 = pres.addSlide();
  s5.background = { color: WHITE };
  s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s5.addText("Fonctionnalites cles", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  const features = [
    { icon: FaUsers, title: "Portail citoyen", desc: "Dashboard personnel, suivi des demandes, telechargement" },
    { icon: FaCogs, title: "Portail admin", desc: "Traitement des demandes, statistiques, gestion" },
    { icon: FaQrcode, title: "Verification QR", desc: "Page publique de verification d'authenticite" },
    { icon: FaBell, title: "Notifications", desc: "Alertes en temps reel sur l'avancement" },
    { icon: FaShieldAlt, title: "Signature numerique", desc: "Documents signes et infalsifiables" },
    { icon: FaFileAlt, title: "Multi-documents", desc: "Acte de naissance, casier, residence, etc." },
  ];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.1;
    const y = 1.3 + row * 2;

    s5.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.85, h: 1.7,
      fill: { color: LIGHT_BG },
      shadow: makeShadow()
    });
    s5.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.85, h: 0.05,
      fill: { color: GREEN }
    });

    const fIcon = await iconToBase64Png(f.icon, "#" + GREEN, 256);
    s5.addImage({ data: fIcon, x: x + 0.2, y: y + 0.25, w: 0.4, h: 0.4 });
    s5.addText(f.title, {
      x: x + 0.15, y: y + 0.7, w: 2.55, h: 0.35,
      fontSize: 13, fontFace: "Calibri", bold: true, color: DARK_TEXT, margin: 0
    });
    s5.addText(f.desc, {
      x: x + 0.15, y: y + 1.05, w: 2.55, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: GRAY, margin: 0
    });
  }

  // ============== SLIDE 6: ARCHITECTURE ==============
  let s6 = pres.addSlide();
  s6.background = { color: LIGHT_BG };
  s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s6.addText("Architecture technique", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  const archItems = [
    { icon: FaGlobe, title: "Frontend Next.js", desc: "Interface moderne, responsive, performante", color: GREEN },
    { icon: FaServer, title: "API REST securisee", desc: "Endpoints authentifies, validation stricte", color: BLUE },
    { icon: FaDatabase, title: "Base nationale", desc: "PostgreSQL avec replication et backups", color: "065A82" },
    { icon: FaLock, title: "Chiffrement E2E", desc: "AES-256, TLS 1.3, donnees au repos", color: RED },
    { icon: FaMapMarkerAlt, title: "Hebergement souverain", desc: "Datacenters dans le pays", color: "6D2E46" },
    { icon: FaMobileAlt, title: "Compatible mobile", desc: "PWA, responsive, SMS/USSD prevu", color: "028090" },
  ];

  for (let i = 0; i < archItems.length; i++) {
    const a = archItems[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.1;
    const y = 1.3 + row * 2;

    s6.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.85, h: 1.7,
      fill: { color: WHITE },
      shadow: makeShadow()
    });
    s6.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.7,
      fill: { color: a.color }
    });

    const aIcon = await iconToBase64Png(a.icon, "#" + a.color, 256);
    s6.addImage({ data: aIcon, x: x + 0.3, y: y + 0.25, w: 0.4, h: 0.4 });
    s6.addText(a.title, {
      x: x + 0.25, y: y + 0.7, w: 2.4, h: 0.35,
      fontSize: 13, fontFace: "Calibri", bold: true, color: DARK_TEXT, margin: 0
    });
    s6.addText(a.desc, {
      x: x + 0.25, y: y + 1.05, w: 2.4, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: GRAY, margin: 0
    });
  }

  // ============== SLIDE 7: SECURITE ==============
  let s7 = pres.addSlide();
  s7.background = { color: BLUE };
  s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  const lockIcon = await iconToBase64Png(FaLock, "#FFFFFF", 256);
  s7.addImage({ data: lockIcon, x: 0.7, y: 0.35, w: 0.5, h: 0.5 });

  s7.addText("Securite & Conformite", {
    x: 1.35, y: 0.3, w: 7, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: WHITE, margin: 0
  });

  const secItems = [
    { title: "Chiffrement AES-256", desc: "Donnees chiffrees au repos et en transit", phase: "" },
    { title: "Audit trail complet", desc: "Traçabilite de chaque acces et modification", phase: "" },
    { title: "Auth biometrique", desc: "Empreinte et reconnaissance faciale", phase: "Phase 2" },
    { title: "Hebergement souverain", desc: "Serveurs dans le pays, controle total", phase: "" },
    { title: "Conformite RGPD", desc: "Respect des lois locales et internationales", phase: "" },
    { title: "Zero-knowledge proofs", desc: "Verification sans reveler les donnees", phase: "Phase 3" },
  ];

  for (let i = 0; i < secItems.length; i++) {
    const sec = secItems[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * 4.6;
    const y = 1.3 + row * 1.35;

    s7.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.2, h: 1.15,
      fill: { color: "253D5E", transparency: 50 }
    });

    const checkIcon = await iconToBase64Png(FaCheckCircle, "#" + GREEN, 256);
    s7.addImage({ data: checkIcon, x: x + 0.2, y: y + 0.15, w: 0.35, h: 0.35 });

    s7.addText(sec.title, {
      x: x + 0.7, y: y + 0.08, w: 3, h: 0.4,
      fontSize: 14, fontFace: "Calibri", bold: true, color: WHITE, margin: 0
    });
    s7.addText(sec.desc, {
      x: x + 0.7, y: y + 0.48, w: 3, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: "CADCFC", margin: 0
    });

    if (sec.phase) {
      s7.addShape(pres.shapes.RECTANGLE, {
        x: x + 3.3, y: y + 0.15, w: 0.75, h: 0.3,
        fill: { color: YELLOW }
      });
      s7.addText(sec.phase, {
        x: x + 3.3, y: y + 0.15, w: 0.75, h: 0.3,
        fontSize: 8, fontFace: "Calibri", bold: true, color: BLUE,
        align: "center", valign: "middle"
      });
    }
  }

  // ============== SLIDE 8: BENCHMARKS ==============
  let s8 = pres.addSlide();
  s8.background = { color: WHITE };
  s8.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s8.addText("Benchmarks internationaux", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  s8.addText("Des modeles qui prouvent que ca marche", {
    x: 0.7, y: 0.95, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: GRAY, margin: 0
  });

  const benchmarks = [
    { country: "Estonie", program: "e-Residency", stat: "99%", desc: "des services publics en ligne", color: "0051A5" },
    { country: "Emirats Arabes", program: "UAE Pass", stat: "6M+", desc: "utilisateurs actifs", color: "C8102E" },
    { country: "Inde", program: "DigiLocker", stat: "150M+", desc: "documents stockes", color: "FF6600" },
    { country: "Rwanda", program: "Irembo", stat: "100+", desc: "services en ligne", color: "00A1DE" },
  ];

  for (let i = 0; i < benchmarks.length; i++) {
    const b = benchmarks[i];
    const x = 0.5 + i * 2.35;

    s8.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.6, w: 2.1, h: 3.3,
      fill: { color: LIGHT_BG },
      shadow: makeShadow()
    });

    // Country color header
    s8.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.6, w: 2.1, h: 0.7,
      fill: { color: b.color }
    });
    s8.addText(b.country, {
      x, y: 1.6, w: 2.1, h: 0.7,
      fontSize: 16, fontFace: "Georgia", bold: true, color: WHITE,
      align: "center", valign: "middle"
    });

    s8.addText(b.stat, {
      x, y: 2.5, w: 2.1, h: 0.8,
      fontSize: 36, fontFace: "Georgia", bold: true, color: b.color,
      align: "center", valign: "middle"
    });

    s8.addText(b.desc, {
      x: x + 0.15, y: 3.3, w: 1.8, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: GRAY, align: "center"
    });

    s8.addText(b.program, {
      x: x + 0.15, y: 4.0, w: 1.8, h: 0.4,
      fontSize: 12, fontFace: "Calibri", bold: true, color: DARK_TEXT, align: "center"
    });
  }

  // ============== SLIDE 9: FEUILLE DE ROUTE ==============
  let s9 = pres.addSlide();
  s9.background = { color: LIGHT_BG };
  s9.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s9.addText("Feuille de route", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  // Timeline line
  s9.addShape(pres.shapes.LINE, { x: 1.5, y: 1.6, w: 7, h: 0, line: { color: GREEN, width: 3 } });

  const phases = [
    {
      label: "Phase 1", time: "6 mois", color: GREEN,
      items: ["MVP avec 5 documents", "Deploiement a Cotonou", "Tests utilisateurs", "Integration etat civil"]
    },
    {
      label: "Phase 2", time: "12 mois", color: BLUE,
      items: ["15 types de documents", "Toutes grandes villes", "Auth biometrique", "App mobile native"]
    },
    {
      label: "Phase 3", time: "24 mois", color: YELLOW,
      items: ["Tous documents", "Integration CEDEAO", "Zero-knowledge proofs", "API secteur prive"]
    },
  ];

  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i];
    const x = 1.2 + i * 2.9;

    // Circle on timeline
    s9.addShape(pres.shapes.OVAL, { x: x + 0.75, y: 1.35, w: 0.5, h: 0.5, fill: { color: ph.color } });

    s9.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.1, w: 2.6, h: 3,
      fill: { color: WHITE },
      shadow: makeShadow()
    });
    s9.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.1, w: 2.6, h: 0.06,
      fill: { color: ph.color }
    });

    s9.addText(ph.label, {
      x, y: 2.25, w: 2.6, h: 0.4,
      fontSize: 16, fontFace: "Georgia", bold: true, color: ph.color === YELLOW ? DARK_TEXT : ph.color,
      align: "center"
    });
    s9.addText(ph.time, {
      x, y: 2.6, w: 2.6, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: GRAY, align: "center"
    });

    const bulletItems = ph.items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < ph.items.length - 1, fontSize: 11, color: DARK_TEXT }
    }));

    s9.addText(bulletItems, {
      x: x + 0.2, y: 3.1, w: 2.2, h: 1.8,
      fontFace: "Calibri", paraSpaceAfter: 4
    });
  }

  // ============== SLIDE 10: BUDGET & ROI ==============
  let s10 = pres.addSlide();
  s10.background = { color: WHITE };
  s10.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s10.addText("Budget & ROI", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  // Big stat callouts
  const budgetStats = [
    { value: "500K-1M", unit: "USD", label: "Investissement initial", color: BLUE },
    { value: "5M+", unit: "USD/an", label: "Economies estimees", color: GREEN },
    { value: "18", unit: "mois", label: "ROI positif", color: "028090" },
  ];

  for (let i = 0; i < budgetStats.length; i++) {
    const bs = budgetStats[i];
    const x = 0.5 + i * 3.15;

    s10.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.9, h: 2,
      fill: { color: LIGHT_BG },
      shadow: makeShadow()
    });
    s10.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.9, h: 0.06,
      fill: { color: bs.color }
    });

    s10.addText(bs.value, {
      x, y: 1.5, w: 2.9, h: 0.8,
      fontSize: 36, fontFace: "Georgia", bold: true, color: bs.color,
      align: "center", valign: "middle"
    });
    s10.addText(bs.unit, {
      x, y: 2.25, w: 2.9, h: 0.3,
      fontSize: 14, fontFace: "Calibri", color: GRAY, align: "center"
    });
    s10.addText(bs.label, {
      x, y: 2.6, w: 2.9, h: 0.4,
      fontSize: 13, fontFace: "Calibri", bold: true, color: DARK_TEXT, align: "center"
    });
  }

  // Savings breakdown
  s10.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.6, w: 9, h: 1.6,
    fill: { color: LIGHT_GREEN },
    shadow: makeShadow()
  });

  s10.addText("Sources d'economies et revenus", {
    x: 0.7, y: 3.7, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Calibri", bold: true, color: GREEN, margin: 0
  });

  const savings = [
    { text: "Reduction du personnel administratif et des locaux", options: { bullet: true, breakLine: true, fontSize: 12, color: DARK_TEXT } },
    { text: "Elimination des couts papier, impression, stockage physique", options: { bullet: true, breakLine: true, fontSize: 12, color: DARK_TEXT } },
    { text: "Revenus API pour banques, assurances, employeurs (verification de documents)", options: { bullet: true, breakLine: true, fontSize: 12, color: DARK_TEXT } },
    { text: "Timbres numeriques generant des revenus directs pour l'Etat", options: { bullet: true, fontSize: 12, color: DARK_TEXT } },
  ];

  s10.addText(savings, { x: 0.9, y: 4.1, w: 8.2, h: 1, fontFace: "Calibri", paraSpaceAfter: 3 });

  // ============== SLIDE 11: EQUIPE ==============
  let s11 = pres.addSlide();
  s11.background = { color: LIGHT_BG };
  s11.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });

  s11.addText("Equipe & Partenaires", {
    x: 0.7, y: 0.3, w: 8, h: 0.7,
    fontSize: 36, fontFace: "Georgia", bold: true, color: BLUE, margin: 0
  });

  const teams = [
    { icon: FaCogs, title: "Equipe technique", items: ["Developpeurs full-stack", "Expert securite", "Designer UX/UI", "DevOps / Infrastructure"], color: GREEN },
    { icon: FaHandshake, title: "Partenaires gouvernementaux", items: ["Ministere de l'Interieur", "Direction de l'Etat Civil", "Ministere du Numerique", "ARCEP Benin"], color: BLUE },
    { icon: FaGlobe, title: "Partenaires technologiques", items: ["Hebergeur souverain", "Fournisseur biometrie", "Operateurs telecom", "Partenaire cloud"], color: "028090" },
  ];

  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const x = 0.5 + i * 3.15;

    s11.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.9, h: 3.6,
      fill: { color: WHITE },
      shadow: makeShadow()
    });
    s11.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 2.9, h: 0.06,
      fill: { color: t.color }
    });

    const tIcon = await iconToBase64Png(t.icon, "#" + t.color, 256);
    s11.addImage({ data: tIcon, x: x + 1.05, y: 1.5, w: 0.5, h: 0.5 });

    s11.addText(t.title, {
      x, y: 2.15, w: 2.9, h: 0.4,
      fontSize: 14, fontFace: "Calibri", bold: true, color: DARK_TEXT, align: "center"
    });

    const tItems = t.items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < t.items.length - 1, fontSize: 11, color: GRAY }
    }));

    s11.addText(tItems, {
      x: x + 0.3, y: 2.7, w: 2.3, h: 2, fontFace: "Calibri", paraSpaceAfter: 4
    });
  }

  // ============== SLIDE 12: CONTACT ==============
  let s12 = pres.addSlide();
  s12.background = { color: BLUE };
  s12.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: GREEN } });
  s12.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.06, w: 10, h: 0.03, fill: { color: YELLOW } });

  const rocketIcon = await iconToBase64Png(FaRocket, "#FCD116", 256);
  s12.addImage({ data: rocketIcon, x: 4.4, y: 0.7, w: 0.7, h: 0.7 });

  s12.addText("Pret a moderniser\nl'administration ?", {
    x: 1, y: 1.5, w: 8, h: 1.2,
    fontSize: 36, fontFace: "Georgia", bold: true, color: WHITE,
    align: "center", lineSpacing: 44
  });

  s12.addText("Rejoignez le mouvement de la transformation digitale", {
    x: 1, y: 2.8, w: 8, h: 0.5,
    fontSize: 16, fontFace: "Calibri", color: "CADCFC", align: "center"
  });

  // Contact cards
  s12.addShape(pres.shapes.RECTANGLE, {
    x: 2, y: 3.5, w: 6, h: 1.2,
    fill: { color: "253D5E", transparency: 50 }
  });

  const emailIcon = await iconToBase64Png(FaEnvelope, "#" + GREEN, 256);
  const phoneIcon = await iconToBase64Png(FaPhone, "#" + GREEN, 256);
  const mapIcon = await iconToBase64Png(FaMapMarkerAlt, "#" + GREEN, 256);

  s12.addImage({ data: emailIcon, x: 2.3, y: 3.7, w: 0.3, h: 0.3 });
  s12.addText("contact@citizenpass.bj", {
    x: 2.7, y: 3.65, w: 3, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: "CADCFC", margin: 0
  });

  s12.addImage({ data: phoneIcon, x: 2.3, y: 4.1, w: 0.3, h: 0.3 });
  s12.addText("+229 XX XX XX XX", {
    x: 2.7, y: 4.05, w: 3, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: "CADCFC", margin: 0
  });

  s12.addImage({ data: mapIcon, x: 5.5, y: 3.9, w: 0.3, h: 0.3 });
  s12.addText("Cotonou, Benin", {
    x: 5.9, y: 3.85, w: 3, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: "CADCFC", margin: 0
  });

  // Bottom bar
  s12.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.37, w: 10, h: 0.25, fill: { color: GREEN } });

  s12.addText("www.citizenpass.bj", {
    x: 0, y: 5.37, w: 10, h: 0.25,
    fontSize: 11, fontFace: "Calibri", color: WHITE, align: "center", valign: "middle"
  });

  // Save
  await pres.writeFile({ fileName: "C:/Users/ENVY/citizenpass/CitizenPass_PitchDeck.pptx" });
  console.log("Pitch deck created successfully!");
}

createDeck().catch(console.error);
