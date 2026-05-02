import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";
import { randomUUID } from "crypto";

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.document.deleteMany();
  await prisma.request.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      nin: "ADMIN-001",
      name: "Administrateur National",
      email: "admin@citizenpass.bj",
      phone: "+229 97 00 00 01",
      password: hashSync("admin123", 10),
      role: "ADMIN",
    },
  });

  const citizen1 = await prisma.user.create({
    data: {
      nin: "BEN-2024-00000001",
      name: "Koffi Adegbola",
      email: "koffi@example.com",
      phone: "+229 97 12 34 56",
      password: hashSync("demo123", 10),
      role: "CITIZEN",
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      nin: "BEN-2024-00000002",
      name: "Adjoa Mensah",
      email: "adjoa@example.com",
      phone: "+229 96 78 90 12",
      password: hashSync("demo123", 10),
      role: "CITIZEN",
    },
  });

  const qr1 = `DOC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const qr2 = `DOC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

  await prisma.document.create({
    data: {
      type: "BIRTH_CERTIFICATE",
      title: "Acte de naissance",
      qrCode: qr1,
      userId: citizen1.id,
    },
  });

  await prisma.document.create({
    data: {
      type: "NATIONALITY_CERTIFICATE",
      title: "Certificat de nationalite",
      qrCode: qr2,
      userId: citizen1.id,
    },
  });

  await prisma.request.create({
    data: {
      type: "CRIMINAL_RECORD",
      reason: "Candidature a un emploi public",
      status: "PENDING",
      userId: citizen1.id,
    },
  });

  await prisma.request.create({
    data: {
      type: "RESIDENCE_CERTIFICATE",
      reason: "Inscription scolaire des enfants",
      status: "PENDING",
      userId: citizen2.id,
    },
  });

  await prisma.request.create({
    data: {
      type: "TAX_CERTIFICATE",
      reason: "Ouverture de compte bancaire",
      status: "PROCESSING",
      userId: citizen2.id,
    },
  });

  console.log("Seed completed!");
  console.log(`Admin: ADMIN-001 / admin123`);
  console.log(`Citizen 1: BEN-2024-00000001 / demo123 (${citizen1.name})`);
  console.log(`Citizen 2: BEN-2024-00000002 / demo123 (${citizen2.name})`);
  console.log(`Document QR codes: ${qr1}, ${qr2}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
