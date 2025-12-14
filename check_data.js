const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst();
    console.log("Sample Product Data:");
    console.log(JSON.stringify(product, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
