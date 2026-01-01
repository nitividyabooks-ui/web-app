/**
 * Script to update Amazon URLs for all products
 * Run with: node prisma/update-amazon-urls.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Amazon URLs for each product (cleaned up short URLs)
const amazonUrls = {
    "miko-meets-animals": "https://www.amazon.in/dp/9355927894",
    "miko-celebrates-festivals": "https://www.amazon.in/dp/9355924593",
    "miko-learns-actions": "https://www.amazon.in/dp/9356020191",
    "gods-and-goddesses": "https://www.amazon.in/dp/935525069X",
    "miko-learns-manners": "https://www.amazon.in/dp/9355253060",
};

async function main() {
    console.log("Updating Amazon URLs for products...\n");

    for (const [productId, amazonUrl] of Object.entries(amazonUrls)) {
        try {
            const updated = await prisma.product.update({
                where: { id: productId },
                data: { amazonUrl },
            });
            console.log(`✅ Updated ${productId}: ${amazonUrl}`);
        } catch (error) {
            console.error(`❌ Failed to update ${productId}:`, error.message);
        }
    }

    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
