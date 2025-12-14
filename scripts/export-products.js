/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function serializeProduct(p) {
  // Prisma returns JS Date objects for DateTime fields and JS objects for Json fields.
  return {
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
  };
}

async function main() {
  const outPath = path.join(__dirname, "../data/products.json");

  const products = await prisma.product.findMany({
    orderBy: [{ heroPriority: "asc" }, { title: "asc" }],
  });

  const serialized = products.map(serializeProduct);

  fs.writeFileSync(outPath, JSON.stringify(serialized, null, 2) + "\n", "utf8");
  console.log(`Exported ${serialized.length} products -> ${outPath}`);
}

main()
  .catch((e) => {
    console.error("Export failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


