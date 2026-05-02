-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cip" TEXT NOT NULL,
    "nin" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "registryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "CitizenRegistry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitizenRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cip" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" DATETIME NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "birthCommune" TEXT NOT NULL,
    "birthDepartment" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Béninoise',
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

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "qrCode" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signatureAlgo" TEXT NOT NULL DEFAULT 'RSA-SHA256',
    "keyId" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "authorityCode" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "validUntil" DATETIME,
    "revokedAt" DATETIME,
    "revokeReason" TEXT,
    "metadata" TEXT,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pipelineStep" TEXT,
    "exceptionReason" TEXT,
    "note" TEXT,
    "autoProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processingStartedAt" DATETIME,
    "processingEndedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SigningKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'RSA-2048',
    "publicKey" TEXT NOT NULL,
    "privateKeyEnc" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "authorityCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cip_key" ON "User"("cip");

-- CreateIndex
CREATE UNIQUE INDEX "User_nin_key" ON "User"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "User_registryId_key" ON "User"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenRegistry_cip_key" ON "CitizenRegistry"("cip");

-- CreateIndex
CREATE UNIQUE INDEX "Document_serialNumber_key" ON "Document"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Document_qrCode_key" ON "Document"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Document_requestId_key" ON "Document"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SigningKey_keyId_key" ON "SigningKey"("keyId");

-- CreateIndex
CREATE UNIQUE INDEX "SigningKey_authorityCode_key" ON "SigningKey"("authorityCode");
