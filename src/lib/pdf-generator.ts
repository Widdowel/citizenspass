import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { ExtractedData } from "./registry";
import type { SignatureBundle } from "./signature";
import { AUTHORITIES, COUNTRY, DOC_TYPES, type AuthorityCode } from "./constants";

const BENIN_GREEN = rgb(0 / 255, 135 / 255, 81 / 255);
const BENIN_YELLOW = rgb(252 / 255, 209 / 255, 22 / 255);
const BENIN_RED = rgb(225 / 255, 24 / 255, 41 / 255);
const INK = rgb(0.13, 0.17, 0.23);
const MUTED = rgb(0.4, 0.45, 0.52);
const RULE = rgb(0.88, 0.9, 0.92);

function frenchDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function maritalLabel(s: string): string {
  switch (s) {
    case "MARRIED":
      return "Marié(e)";
    case "DIVORCED":
      return "Divorcé(e)";
    case "WIDOWED":
      return "Veuf / Veuve";
    case "SINGLE":
    default:
      return "Célibataire";
  }
}

function genderLabel(s: string): string {
  return s === "F" ? "Féminin" : "Masculin";
}

type DrawCtx = {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  width: number;
  height: number;
};

function drawHeader(ctx: DrawCtx, authorityCode: AuthorityCode, serialNumber: string) {
  const { page, font, fontBold, width } = ctx;
  const auth = AUTHORITIES[authorityCode];

  // Drapeau bandes verticales en haut à gauche
  page.drawRectangle({ x: 40, y: 770, width: 12, height: 50, color: BENIN_GREEN });
  page.drawRectangle({ x: 52, y: 770, width: 12, height: 50, color: BENIN_YELLOW });
  page.drawRectangle({ x: 64, y: 770, width: 12, height: 50, color: BENIN_RED });

  // Bloc d'État
  page.drawText(COUNTRY.name.toUpperCase(), {
    x: 90, y: 805, size: 13, font: fontBold, color: INK,
  });
  page.drawText(COUNTRY.motto, {
    x: 90, y: 790, size: 9, font, color: MUTED,
  });
  page.drawText(auth.subtitle, {
    x: 90, y: 776, size: 8, font, color: MUTED,
  });

  // Autorité émettrice (à droite)
  const authText = auth.name.toUpperCase();
  const authW = fontBold.widthOfTextAtSize(authText, 11);
  page.drawText(authText, {
    x: width - 40 - authW, y: 805, size: 11, font: fontBold, color: BENIN_GREEN,
  });
  const subText = `Autorité émettrice — Code ${auth.shortName}`;
  const subW = font.widthOfTextAtSize(subText, 8);
  page.drawText(subText, {
    x: width - 40 - subW, y: 791, size: 8, font, color: MUTED,
  });
  const serialText = `Réf. ${serialNumber}`;
  const serialW = font.widthOfTextAtSize(serialText, 8);
  page.drawText(serialText, {
    x: width - 40 - serialW, y: 778, size: 8, font, color: MUTED,
  });

  // Ligne de séparation
  page.drawLine({
    start: { x: 40, y: 760 },
    end: { x: width - 40, y: 760 },
    thickness: 1,
    color: BENIN_GREEN,
  });
}

function drawWatermark(ctx: DrawCtx) {
  const { page, fontBold, width } = ctx;
  const text = "RÉPUBLIQUE DU BÉNIN";
  page.drawText(text, {
    x: width / 2 - 220,
    y: 380,
    size: 60,
    font: fontBold,
    color: rgb(0.92, 0.96, 0.93),
    rotate: degrees(35),
    opacity: 0.5,
  });
}

function drawTitle(ctx: DrawCtx, title: string) {
  const { page, fontBold, width } = ctx;
  const upper = title.toUpperCase();
  const w = fontBold.widthOfTextAtSize(upper, 18);
  page.drawText(upper, {
    x: (width - w) / 2,
    y: 715,
    size: 18,
    font: fontBold,
    color: INK,
  });
  page.drawLine({
    start: { x: width / 2 - 60, y: 705 },
    end: { x: width / 2 + 60, y: 705 },
    thickness: 2,
    color: BENIN_GREEN,
  });
}

type Field = { label: string; value: string };

function drawFields(ctx: DrawCtx, startY: number, fields: Field[]): number {
  const { page, font, fontBold } = ctx;
  let y = startY;
  const labelX = 60;
  const valueX = 240;

  for (const f of fields) {
    page.drawText(f.label, { x: labelX, y, size: 10, font, color: MUTED });
    const value = f.value || "—";
    page.drawText(value, { x: valueX, y, size: 11, font: fontBold, color: INK });
    y -= 22;
  }
  return y;
}

function drawSectionTitle(ctx: DrawCtx, y: number, text: string): number {
  const { page, fontBold, width } = ctx;
  page.drawText(text, { x: 60, y, size: 11, font: fontBold, color: BENIN_GREEN });
  page.drawLine({
    start: { x: 60, y: y - 4 },
    end: { x: width - 60, y: y - 4 },
    thickness: 0.5,
    color: RULE,
  });
  return y - 22;
}

function drawBody(ctx: DrawCtx, type: string, data: ExtractedData): number {
  let y = 670;

  y = drawSectionTitle(ctx, y, "IDENTITÉ DU CITOYEN");
  y = drawFields(ctx, y, [
    { label: "Nom & Prénoms", value: data.fullName },
    { label: "Sexe", value: genderLabel(data.gender) },
    { label: "Date de naissance", value: frenchDate(data.birthDate) },
    { label: "Lieu de naissance", value: `${data.birthPlace} (${data.birthCommune}, ${data.birthDepartment})` },
    { label: "Nationalité", value: data.nationality },
    { label: "Identifiant CIP (ANIP)", value: data.cip },
  ]);

  y -= 8;

  if (type === "BIRTH_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "FILIATION");
    y = drawFields(ctx, y, [
      { label: "Père", value: data.fatherName ?? "Non déclaré" },
      { label: "Mère", value: data.motherName ?? "Non déclarée" },
    ]);
  }

  if (type === "RESIDENCE_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "RÉSIDENCE DÉCLARÉE");
    y = drawFields(ctx, y, [
      { label: "Adresse", value: data.address ?? "—" },
      { label: "Commune", value: data.commune ?? "—" },
      { label: "Département", value: data.department ?? "—" },
    ]);
  }

  if (type === "NATIONALITY_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "MENTION DE NATIONALITÉ");
    const { page, font } = ctx;
    const txt = `Le citoyen susnommé est de nationalité ${data.nationality.toLowerCase()} par naissance, conformément aux dispositions du Code de la nationalité béninoise.`;
    page.drawText(txt, { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 });
    y -= 50;
  }

  if (type === "CRIMINAL_RECORD") {
    y = drawSectionTitle(ctx, y, "BULLETIN N°3 — RELEVÉ DU CASIER JUDICIAIRE");
    const status = data.judicialStatus ?? "CLEAN";
    const verdict = status === "CLEAN" ? "NÉANT" : status === "ONGOING" ? "PROCÉDURE EN COURS" : "CONDAMNATION INSCRITE";
    const { page, fontBold, font } = ctx;
    page.drawText("Mentions au casier :", { x: 60, y, size: 10, font, color: MUTED });
    page.drawText(verdict, { x: 200, y, size: 14, font: fontBold, color: status === "CLEAN" ? BENIN_GREEN : BENIN_RED });
    y -= 22;
    if (status === "CLEAN") {
      page.drawText(
        "Aucune condamnation ne figure au bulletin n°3 du casier judiciaire de l'intéressé(e).",
        { x: 60, y, size: 10, font, color: INK, maxWidth: 475 },
      );
      y -= 18;
    }
  }

  if (type === "TAX_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "SITUATION FISCALE");
    const status = data.fiscalStatus ?? "UP_TO_DATE";
    const verdict = status === "UP_TO_DATE" ? "À JOUR" : status === "PENDING" ? "RÉGULARISATION EN COURS" : "NON À JOUR";
    const { page, fontBold, font } = ctx;
    page.drawText("Statut fiscal :", { x: 60, y, size: 10, font, color: MUTED });
    page.drawText(verdict, { x: 200, y, size: 14, font: fontBold, color: status === "UP_TO_DATE" ? BENIN_GREEN : BENIN_RED });
    y -= 22;
    page.drawText(
      "Le présent quitus atteste que le contribuable a satisfait à ses obligations fiscales courantes.",
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475 },
    );
    y -= 18;
  }

  if (type === "MARRIAGE_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "ACTE DE MARIAGE");
    y = drawFields(ctx, y, [
      { label: "Statut matrimonial", value: maritalLabel(data.maritalStatus) },
      { label: "Conjoint(e)", value: data.spouseName ?? "Non déclaré(e)" },
    ]);
  }

  if (type === "INDIVIDUALITY_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "CERTIFICAT D'INDIVIDUALITÉ");
    const { page, font } = ctx;
    page.drawText(
      `Il est certifié que ${data.fullName}, identifié sous le CIP ${data.cip}, est une seule et même personne, distincte de tout homonyme.`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 50;
  }

  if (type === "CELIBACY_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "CERTIFICAT DE CÉLIBAT");
    const { page, font } = ctx;
    const isSingle = data.maritalStatus === "SINGLE";
    page.drawText(
      isSingle
        ? `Il est certifié que ${data.fullName} est célibataire et n'a contracté aucun mariage à ce jour selon le registre national.`
        : `Statut matrimonial : ${maritalLabel(data.maritalStatus)}`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 35;
  }

  if (type === "COLLECTIVE_LIFE_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "CERTIFICAT DE VIE COLLECTIVE");
    const { page, font } = ctx;
    page.drawText(
      `Il est certifié que ${data.fullName} est en vie à la date de délivrance du présent certificat.`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 35;
  }

  if (type === "DEATH_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "ACTE DE DÉCÈS");
    y = drawFields(ctx, y, [
      { label: "Statut", value: "Décès enregistré au registre national" },
    ]);
  }

  if (type === "CIP_ATTESTATION") {
    y = drawSectionTitle(ctx, y, "ATTESTATION CIP — IDENTIFIANT NATIONAL");
    const { page, font } = ctx;
    page.drawText(
      `L'Agence Nationale d'Identification atteste que la Carte d'Identité Personnelle ${data.cip} est valide et active dans le registre national des personnes physiques.`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 50;
  }

  if (type === "CEDEAO_PASSPORT_ATTESTATION") {
    y = drawSectionTitle(ctx, y, "ATTESTATION DE PASSEPORT CEDEAO");
    y = drawFields(ctx, y, [
      { label: "Identifiant CIP", value: data.cip },
      { label: "Nationalité", value: data.nationality },
      { label: "Validité CEDEAO", value: "Permet la libre circulation dans l'espace CEDEAO" },
    ]);
  }

  if (type === "NON_CONVICTION_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "CERTIFICAT DE NON-CONDAMNATION");
    const { page, font } = ctx;
    page.drawText(
      `Il est certifié qu'aucune condamnation pénale n'est inscrite au casier judiciaire de ${data.fullName} (CIP ${data.cip}) à la date de délivrance.`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 50;
  }

  if (type === "NON_BANKRUPTCY_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "CERTIFICAT DE NON-FAILLITE");
    const { page, font } = ctx;
    page.drawText(
      `Il est certifié qu'aucune procédure collective (faillite, redressement) n'est inscrite contre ${data.fullName} au registre du commerce.`,
      { x: 60, y, size: 10, font, color: INK, maxWidth: 475, lineHeight: 14 },
    );
    y -= 50;
  }

  if (type === "DOMICILE_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "DOMICILE DÉCLARÉ");
    y = drawFields(ctx, y, [
      { label: "Adresse", value: data.address ?? "—" },
      { label: "Commune", value: data.commune ?? "—" },
      { label: "Département", value: data.department ?? "—" },
    ]);
  }

  if (type === "IFU_ATTESTATION") {
    y = drawSectionTitle(ctx, y, "IDENTIFIANT FISCAL UNIQUE");
    y = drawFields(ctx, y, [
      { label: "IFU rattaché au CIP", value: data.cip },
      { label: "Statut", value: "Actif et opérationnel" },
    ]);
  }

  if (type === "VAT_PAYMENT_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "ATTESTATION DE PAIEMENT TVA");
    y = drawFields(ctx, y, [
      { label: "Statut TVA", value: data.fiscalStatus === "UP_TO_DATE" ? "À jour" : "Non à jour" },
    ]);
  }

  if (type === "PATENTE_CERTIFICATE") {
    y = drawSectionTitle(ctx, y, "QUITUS PATENTE");
    y = drawFields(ctx, y, [
      { label: "Statut patente", value: data.fiscalStatus === "UP_TO_DATE" ? "À jour" : "Non à jour" },
    ]);
  }

  return y;
}

async function drawSignatureBlock(
  ctx: DrawCtx,
  bundle: SignatureBundle,
  qrPng: Uint8Array,
  pdf: PDFDocument,
  validUntil: string | null,
  verifyUrl: string,
) {
  const { page, font, fontBold, width } = ctx;

  // Bloc signature en bas
  const blockTop = 200;
  page.drawRectangle({
    x: 40,
    y: 50,
    width: width - 80,
    height: blockTop - 50,
    borderColor: BENIN_GREEN,
    borderWidth: 1,
    color: rgb(0.97, 0.99, 0.97),
  });

  page.drawText("SIGNATURE NUMÉRIQUE QUALIFIÉE", {
    x: 60, y: blockTop - 22, size: 10, font: fontBold, color: BENIN_GREEN,
  });

  const sigStart = 160;
  const lines: Field[] = [
    { label: "Algorithme", value: `${bundle.signatureAlgo} (RSA-2048, SHA-256)` },
    { label: "Empreinte clé", value: bundle.keyId },
    { label: "Hash document", value: bundle.payloadHash.slice(0, 32) + "…" },
    { label: "Émetteur", value: bundle.authority },
    { label: "Horodatage", value: new Date(bundle.signedAt).toLocaleString("fr-FR") },
    { label: "Validité", value: validUntil ? `Jusqu'au ${frenchDate(validUntil)}` : "Permanente (acte d'origine)" },
  ];

  let y = sigStart - 5;
  for (const f of lines) {
    page.drawText(f.label, { x: 60, y, size: 8, font, color: MUTED });
    page.drawText(f.value, { x: 160, y, size: 9, font: fontBold, color: INK });
    y -= 14;
  }

  // Signature en base64 tronquée
  const sig = bundle.signature.replace(/\s+/g, "");
  const sigShort = sig.slice(0, 56) + "…" + sig.slice(-12);
  page.drawText("Signature : " + sigShort, {
    x: 60, y: 65, size: 7, font, color: MUTED,
  });

  // QR à droite
  const qrImg = await pdf.embedPng(qrPng);
  const qrSize = 110;
  page.drawImage(qrImg, {
    x: width - 60 - qrSize,
    y: 70,
    width: qrSize,
    height: qrSize,
  });
  const qrLabel = "Scannez pour vérifier";
  const qrW = font.widthOfTextAtSize(qrLabel, 7);
  page.drawText(qrLabel, {
    x: width - 60 - qrSize + (qrSize - qrW) / 2,
    y: 60,
    size: 7,
    font,
    color: MUTED,
  });

  // URL de vérification
  page.drawText(verifyUrl, {
    x: 60, y: 30, size: 7, font, color: MUTED,
  });
}

export type GeneratePdfInput = {
  type: string;
  serialNumber: string;
  qrCode: string;
  data: ExtractedData;
  authorityCode: AuthorityCode;
  signature: SignatureBundle;
  issuedAt: string;
  validUntil: string | null;
  verifyUrl: string;
};

export async function generateOfficialPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${DOC_TYPES[input.type] ?? input.type} — ${input.data.fullName}`);
  pdf.setAuthor(AUTHORITIES[input.authorityCode].name);
  pdf.setProducer("CitizenPass — République du Bénin");
  pdf.setCreator("CitizenPass eGov Platform");
  pdf.setSubject(`Document officiel ${input.serialNumber}`);

  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: DrawCtx = {
    page,
    font,
    fontBold,
    width: page.getWidth(),
    height: page.getHeight(),
  };

  drawWatermark(ctx);
  drawHeader(ctx, input.authorityCode, input.serialNumber);
  drawTitle(ctx, DOC_TYPES[input.type] ?? input.type);

  // Date d'émission au-dessus du corps
  const issuedText = `Émis le ${frenchDate(input.issuedAt)} à Cotonou`;
  const issuedW = font.widthOfTextAtSize(issuedText, 10);
  page.drawText(issuedText, {
    x: ctx.width - 60 - issuedW,
    y: 690,
    size: 10,
    font,
    color: MUTED,
  });

  drawBody(ctx, input.type, input.data);

  const qrPng = await QRCode.toBuffer(input.verifyUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#008751", light: "#ffffff" },
  });

  await drawSignatureBlock(
    ctx,
    input.signature,
    new Uint8Array(qrPng),
    pdf,
    input.validUntil,
    input.verifyUrl,
  );

  return await pdf.save();
}
