-- EmailSubscriber table is in prisma/schema.prisma but was never migrated to the
-- database, so every email capture endpoint (/api/email-subscribers) returns 500.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: all statements are IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "EmailSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailSubscriber_email_key" ON "EmailSubscriber"("email");
CREATE INDEX IF NOT EXISTS "EmailSubscriber_source_idx" ON "EmailSubscriber"("source");
CREATE INDEX IF NOT EXISTS "EmailSubscriber_createdAt_idx" ON "EmailSubscriber"("createdAt");
