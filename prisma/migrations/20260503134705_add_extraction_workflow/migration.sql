-- AlterTable
ALTER TABLE "Request" ADD COLUMN "extractionAt" DATETIME;
ALTER TABLE "Request" ADD COLUMN "extractionTarget" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CitizenRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cip" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" DATETIME,
    "birthPlace" TEXT,
    "birthCommune" TEXT,
    "birthDepartment" TEXT,
    "gender" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Béninoise',
    "sourceType" TEXT NOT NULL DEFAULT 'DIGITAL_NATIVE',
    "paperReference" TEXT,
    "digitizedAt" DATETIME,
    "digitizedById" TEXT,
    "fatherName" TEXT,
    "fatherCip" TEXT,
    "motherName" TEXT,
    "motherCip" TEXT,
    "maritalStatus" TEXT NOT NULL DEFAULT 'SINGLE',
    "spouseName" TEXT,
    "spouseCip" TEXT,
    "address" TEXT,
    "commune" TEXT,
    "department" TEXT,
    "photoUrl" TEXT,
    "biometricHash" TEXT,
    "judicialStatus" TEXT NOT NULL DEFAULT 'CLEAN',
    "judicialDetails" TEXT,
    "fiscalStatus" TEXT NOT NULL DEFAULT 'UP_TO_DATE',
    "cedeaoCardNumber" TEXT,
    "passportNumber" TEXT,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CitizenRegistry" ("address", "biometricHash", "birthCommune", "birthDate", "birthDepartment", "birthPlace", "cedeaoCardNumber", "cip", "commune", "department", "enrolledAt", "fatherCip", "fatherName", "firstName", "fiscalStatus", "gender", "id", "judicialDetails", "judicialStatus", "lastName", "lastUpdatedAt", "maritalStatus", "middleName", "motherCip", "motherName", "nationality", "passportNumber", "photoUrl", "spouseCip", "spouseName") SELECT "address", "biometricHash", "birthCommune", "birthDate", "birthDepartment", "birthPlace", "cedeaoCardNumber", "cip", "commune", "department", "enrolledAt", "fatherCip", "fatherName", "firstName", "fiscalStatus", "gender", "id", "judicialDetails", "judicialStatus", "lastName", "lastUpdatedAt", "maritalStatus", "middleName", "motherCip", "motherName", "nationality", "passportNumber", "photoUrl", "spouseCip", "spouseName" FROM "CitizenRegistry";
DROP TABLE "CitizenRegistry";
ALTER TABLE "new_CitizenRegistry" RENAME TO "CitizenRegistry";
CREATE UNIQUE INDEX "CitizenRegistry_cip_key" ON "CitizenRegistry"("cip");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
