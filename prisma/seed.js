const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const email = "admin@nitividya.com";
    const password = "admin123"; // Change this in production!

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            name: "Admin User",
        },
    });

    console.log({ user });

    // Seed Products
    const fs = require("fs");
    const path = require("path");

    const productsFilePath = path.join(__dirname, "../data/products.json");
    const productsData = JSON.parse(fs.readFileSync(productsFilePath, "utf8"));

    console.log(`Seeding ${productsData.length} products...`);

    for (const product of productsData) {
        // Ensure dates are Date objects
        if (product.publishedAt) product.publishedAt = new Date(product.publishedAt);
        if (product.createdAt) product.createdAt = new Date(product.createdAt);
        if (product.updatedAt) product.updatedAt = new Date(product.updatedAt);

        await prisma.product.upsert({
            where: { slug: product.slug },
            update: product,
            create: product,
        });
    }
    console.log("Products seeded successfully.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
