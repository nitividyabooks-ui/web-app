CREATE TABLE "OrderCommunication" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "emailFrom" TEXT,
    "emailReplyTo" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderCommunication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrderCommunication_requestKey_key" ON "OrderCommunication"("requestKey");
CREATE INDEX "OrderCommunication_orderId_createdAt_idx" ON "OrderCommunication"("orderId", "createdAt");
ALTER TABLE "OrderCommunication" ADD CONSTRAINT "OrderCommunication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
