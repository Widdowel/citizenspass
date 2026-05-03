/*
  Warnings:

  - You are about to drop the column `code` on the `OtpCode` table. All the data in the column will be lost.
  - You are about to drop the column `apiKey` on the `VerifierApp` table. All the data in the column will be lost.
  - Added the required column `codeHash` to the `OtpCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apiKeyHash` to the `VerifierApp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apiKeyPrefix` to the `VerifierApp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SigningKey" ADD COLUMN "privateKeyIv" TEXT;
ALTER TABLE "SigningKey" ADD COLUMN "privateKeyTag" TEXT;

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AccountLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OtpCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "phoneMask" TEXT NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OtpCode" ("channel", "consumed", "createdAt", "expiresAt", "id", "phoneMask", "userId") SELECT "channel", "consumed", "createdAt", "expiresAt", "id", "phoneMask", "userId" FROM "OtpCode";
DROP TABLE "OtpCode";
ALTER TABLE "new_OtpCode" RENAME TO "OtpCode";
CREATE INDEX "OtpCode_userId_consumed_idx" ON "OtpCode"("userId", "consumed");
CREATE TABLE "new_VerifierApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyPrefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VerifierApp" ("category", "contactEmail", "createdAt", "id", "isActive", "name") SELECT "category", "contactEmail", "createdAt", "id", "isActive", "name" FROM "VerifierApp";
DROP TABLE "VerifierApp";
ALTER TABLE "new_VerifierApp" RENAME TO "VerifierApp";
CREATE UNIQUE INDEX "VerifierApp_apiKeyHash_key" ON "VerifierApp"("apiKeyHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RateLimitEvent_scope_identifier_createdAt_idx" ON "RateLimitEvent"("scope", "identifier", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountLock_userId_key" ON "AccountLock"("userId");
