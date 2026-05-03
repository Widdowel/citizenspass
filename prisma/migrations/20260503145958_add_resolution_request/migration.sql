-- CreateTable
CREATE TABLE "ResolutionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentId" TEXT,
    "citizenComment" TEXT,
    "reviewerNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResolutionRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionRequest_requestId_key" ON "ResolutionRequest"("requestId");

-- CreateIndex
CREATE INDEX "ResolutionRequest_type_status_idx" ON "ResolutionRequest"("type", "status");
