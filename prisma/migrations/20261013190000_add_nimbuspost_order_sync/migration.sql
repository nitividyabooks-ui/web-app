-- CreateEnum
CREATE TYPE "NimbusPostOrderSyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'SYNCED', 'REVIEW', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NimbusPostPaymentType" AS ENUM ('PREPAID', 'COD');

-- CreateTable
CREATE TABLE "NimbusPostOrderSync" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantOrderNumber" TEXT NOT NULL,
    "status" "NimbusPostOrderSyncStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "NimbusPostPaymentType" NOT NULL,
    "providerOrderId" TEXT,
    "payloadSnapshot" JSONB,
    "payloadHash" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "dispatchStartedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NimbusPostOrderSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NimbusPostOrderSync_orderId_key" ON "NimbusPostOrderSync"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "NimbusPostOrderSync_merchantOrderNumber_key" ON "NimbusPostOrderSync"("merchantOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NimbusPostOrderSync_providerOrderId_key" ON "NimbusPostOrderSync"("providerOrderId");

-- CreateIndex
CREATE INDEX "NimbusPostOrderSync_status_nextAttemptAt_idx" ON "NimbusPostOrderSync"("status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "NimbusPostOrderSync" ADD CONSTRAINT "NimbusPostOrderSync_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
