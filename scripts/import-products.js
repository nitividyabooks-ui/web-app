/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  // If invalid date, return null so Prisma can reject if field is required (better than writing bad data).
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeProductForPrisma(raw) {
  // For updates: do NOT attempt to update the primary key `id`.
  // For creates: `id` is required by schema (String @id).
  const {
    id,
    createdAt,
    updatedAt,
    publishedAt,
    ...rest
  } = raw;

  return {
    id,
    ...rest,
    createdAt: toDateOrNull(createdAt),
    updatedAt: toDateOrNull(updatedAt),
    publishedAt: toDateOrNull(publishedAt),
  };
}

async function main() {
  const inPath = path.join(__dirname, "../data/products.json");
  const raw = JSON.parse(fs.readFileSync(inPath, "utf8"));

  if (!Array.isArray(raw)) {
    throw new Error("data/products.json must be an array of products");
  }

  console.log(`Importing ${raw.length} products from ${inPath}...`);

  for (const p of raw) {
    const normalized = normalizeProductForPrisma(p);
    if (!normalized.slug) {
      throw new Error(`Product is missing slug: ${JSON.stringify(p)}`);
    }
    if (!normalized.id) {
      throw new Error(`Product is missing id (required by schema): ${normalized.slug}`);
    }
    if (!normalized.publishedAt) {
      throw new Error(`Product is missing/invalid publishedAt (required by schema): ${normalized.slug}`);
    }

    const { id, ...updateData } = normalized;

    await prisma.product.upsert({
      where: { slug: normalized.slug },
      update: updateData,
      create: normalized,
    });
  }

  console.log("Import complete.");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


