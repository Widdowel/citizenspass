-- CreateTable
CREATE TABLE "VerifierApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verifierId" TEXT NOT NULL,
    "citizenCip" TEXT NOT NULL,
    "citizenId" TEXT,
    "attributesAsked" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseAttrs" TEXT,
    "responseSignature" TEXT,
    "responseKeyId" TEXT,
    "responseHash" TEXT,
    "authorizedAt" DATETIME,
    "deniedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationRequest_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "VerifierApp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifierApp_apiKey_key" ON "VerifierApp"("apiKey");

-- CreateIndex
CREATE INDEX "VerificationRequest_citizenCip_status_idx" ON "VerificationRequest"("citizenCip", "status");
