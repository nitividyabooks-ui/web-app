/* eslint-disable @typescript-eslint/no-require-imports -- Prisma seed scripts run as Node CommonJS in this repository. */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper function to generate a random date within the last N days
function getRandomDateInLastDays(days) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
    return new Date(randomTime);
}

// Known sample fixtures are shared with the public-display exclusion filter.
const { reviews, testimonials } = require("../src/lib/sample-feedback.json");

async function main() {
    console.log("🌱 Seeding reviews and testimonials...\n");

    // Never delete customer records or seed fictitious social proof into production.
    if (process.env.NODE_ENV === "production") {
        throw new Error("Sample feedback may only be seeded in development.");
    }

    // Seed reviews with random dates from the last 30 days
    console.log("\n📝 Seeding reviews...");
    for (const review of reviews) {
        try {
            const randomDate = getRandomDateInLastDays(30);
            await prisma.review.create({
                data: {
                    ...review,
                    isVerified: false,
                    isApproved: false,
                    createdAt: randomDate,
                },
            });
            console.log(`  ✓ Added review for ${review.productId} by ${review.authorName} (${randomDate.toLocaleDateString()})`);
        } catch (error) {
            console.log(`  ✗ Failed to add review for ${review.productId}: ${error.message}`);
        }
    }

    // Seed testimonials
    console.log("\n💬 Seeding testimonials...");
    for (const testimonial of testimonials) {
        try {
            await prisma.testimonial.create({
                data: { ...testimonial, isActive: false },
            });
            console.log(`  ✓ Added testimonial from ${testimonial.authorName}`);
        } catch (error) {
            console.log(`  ✗ Failed to add testimonial from ${testimonial.authorName}: ${error.message}`);
        }
    }

    // Summary
    const reviewCount = await prisma.review.count();
    const testimonialCount = await prisma.testimonial.count();

    console.log("\n✅ Seeding complete!");
    console.log(`   Reviews: ${reviewCount}`);
    console.log(`   Testimonials: ${testimonialCount}`);
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

