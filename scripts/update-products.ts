
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Example: Update the banner title for a specific book
    // Replace 'slug-of-the-book' with the actual slug
    // Replace the text with your desired content

    /*
    await prisma.product.update({
      where: { slug: "gods-and-goddesses" },
      data: {
        bannerTitle: "Gods & Goddesses",
        bannerSubtitle: "Ancient Wisdom for Modern Kids",
        shortDescription: "A beautiful introduction to Hindu deities...",
      },
    });
    */

    console.log("Update script ready. Uncomment the code and fill in the details to run.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
