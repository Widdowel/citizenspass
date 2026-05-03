import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashSync } from "bcryptjs";

function makePrisma() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (url) {
    return new PrismaClient({ adapter: new PrismaLibSql({ url, authToken: token }) });
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:dev.db" }) });
}

const prisma = makePrisma();

type CitizenSeed = {
  cip: string;
  nin: string | null;
  password: string;
  role: "ADMIN" | "CITIZEN";
  registry?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    birthDate: string;
    birthPlace: string;
    birthCommune: string;
    birthDepartment: string;
    gender: "M" | "F";
    fatherName?: string;
    motherName?: string;
    maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
    spouseName?: string;
    address?: string;
    commune?: string;
    department?: string;
    judicialStatus?: "CLEAN" | "ONGOING" | "CONVICTED";
    judicialDetails?: string;
    fiscalStatus?: "UP_TO_DATE" | "PENDING" | "OVERDUE";
    cedeaoCardNumber?: string;
    passportNumber?: string;
  };
};

const SEED: CitizenSeed[] = [
  {
    cip: "ADMIN-001",
    nin: null,
    password: "admin123",
    role: "ADMIN",
  },
  {
    cip: "1234-5678-9012",
    nin: "BEN-2024-00000001",
    password: "demo123",
    role: "CITIZEN",
    registry: {
      firstName: "Koffi",
      middleName: "Emmanuel",
      lastName: "Adégbola",
      birthDate: "1992-03-14",
      birthPlace: "Hôpital de zone, Cotonou",
      birthCommune: "Cotonou",
      birthDepartment: "Littoral",
      gender: "M",
      fatherName: "Adégbola Pierre",
      motherName: "Houngbédji Marie-Louise",
      maritalStatus: "MARRIED",
      spouseName: "Adégbola née Sossou Béatrice",
      address: "Lot 412, Quartier Cadjèhoun",
      commune: "Cotonou",
      department: "Littoral",
      judicialStatus: "CLEAN",
      fiscalStatus: "UP_TO_DATE",
      cedeaoCardNumber: "CEDEAO-BEN-2024-001234",
      passportNumber: "23ABC4567",
    },
  },
  {
    cip: "2345-6789-0123",
    nin: "BEN-2024-00000002",
    password: "demo123",
    role: "CITIZEN",
    registry: {
      firstName: "Adjoa",
      middleName: "Reine",
      lastName: "Mensah",
      birthDate: "1988-11-02",
      birthPlace: "Maternité Notre-Dame, Porto-Novo",
      birthCommune: "Porto-Novo",
      birthDepartment: "Ouémé",
      gender: "F",
      fatherName: "Mensah Kossi",
      motherName: "Aïnoumon Aurélie",
      maritalStatus: "SINGLE",
      address: "Rue 5.207, Quartier Akpakpa",
      commune: "Cotonou",
      department: "Littoral",
      judicialStatus: "CLEAN",
      fiscalStatus: "PENDING",
    },
  },
  {
    cip: "3456-7890-1234",
    nin: "BEN-2024-00000003",
    password: "demo123",
    role: "CITIZEN",
    registry: {
      firstName: "Yves",
      lastName: "Houngbédji",
      birthDate: "1979-06-21",
      birthPlace: "Mairie de Parakou",
      birthCommune: "Parakou",
      birthDepartment: "Borgou",
      gender: "M",
      fatherName: "Houngbédji Norbert",
      motherName: "Bio Sika Salimatou",
      maritalStatus: "MARRIED",
      spouseName: "Houngbédji née Adam Fatima",
      address: "Quartier Tourou, Avenue de l'Indépendance",
      commune: "Parakou",
      department: "Borgou",
      judicialStatus: "ONGOING",
      judicialDetails: "Procédure n° 2025/PR/4421 — comparution au tribunal de Parakou",
      fiscalStatus: "UP_TO_DATE",
    },
  },
  {
    cip: "4567-8901-2345",
    nin: "BEN-2024-00000004",
    password: "demo123",
    role: "CITIZEN",
    registry: {
      firstName: "Fatouma",
      lastName: "Bio Sani",
      birthDate: "2001-01-30",
      birthPlace: "Centre de santé de Natitingou",
      birthCommune: "Natitingou",
      birthDepartment: "Atacora",
      gender: "F",
      fatherName: "Bio Sani Issa",
      motherName: "N'Tcha Awa",
      maritalStatus: "SINGLE",
      address: "Quartier Béribawou",
      commune: "Natitingou",
      department: "Atacora",
      judicialStatus: "CLEAN",
      fiscalStatus: "OVERDUE",
    },
  },
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.request.deleteMany();
  await prisma.user.deleteMany();
  await prisma.citizenRegistry.deleteMany();
  await prisma.signingKey.deleteMany();

  for (const c of SEED) {
    let registryId: string | undefined;
    if (c.registry) {
      const reg = await prisma.citizenRegistry.create({
        data: {
          cip: c.cip,
          firstName: c.registry.firstName,
          lastName: c.registry.lastName,
          middleName: c.registry.middleName,
          birthDate: new Date(c.registry.birthDate),
          birthPlace: c.registry.birthPlace,
          birthCommune: c.registry.birthCommune,
          birthDepartment: c.registry.birthDepartment,
          gender: c.registry.gender,
          fatherName: c.registry.fatherName,
          motherName: c.registry.motherName,
          maritalStatus: c.registry.maritalStatus ?? "SINGLE",
          spouseName: c.registry.spouseName,
          address: c.registry.address,
          commune: c.registry.commune,
          department: c.registry.department,
          judicialStatus: c.registry.judicialStatus ?? "CLEAN",
          judicialDetails: c.registry.judicialDetails,
          fiscalStatus: c.registry.fiscalStatus ?? "UP_TO_DATE",
          cedeaoCardNumber: c.registry.cedeaoCardNumber,
          passportNumber: c.registry.passportNumber,
        },
      });
      registryId = reg.id;
    }

    const fullName = c.registry
      ? [c.registry.firstName, c.registry.middleName, c.registry.lastName]
          .filter(Boolean)
          .join(" ")
      : c.cip === "ADMIN-001"
      ? "Administrateur National"
      : c.cip;

    await prisma.user.create({
      data: {
        cip: c.cip,
        nin: c.nin,
        name: fullName,
        email:
          c.cip === "ADMIN-001"
            ? "admin@citizenpass.bj"
            : `${c.registry!.firstName.toLowerCase()}@example.bj`,
        phone: c.role === "ADMIN" ? "+229 97 00 00 01" : undefined,
        password: hashSync(c.password, 10),
        role: c.role,
        registryId,
      },
    });
  }

  console.log("✓ Seed completed.");
  console.log("  Admin:    ADMIN-001 / admin123");
  console.log("  Citoyen 1: 1234-5678-9012 / demo123 (Koffi Adégbola — clean)");
  console.log("  Citoyen 2: 2345-6789-0123 / demo123 (Adjoa Mensah — fisc PENDING)");
  console.log("  Citoyen 3: 3456-7890-1234 / demo123 (Yves Houngbédji — JUDICIAL ONGOING → exception)");
  console.log("  Citoyen 4: 4567-8901-2345 / demo123 (Fatouma Bio Sani — fisc OVERDUE → exception)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
