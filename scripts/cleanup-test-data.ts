/**
 * Cleanup Script - Remove all test data
 * 
 * This script deletes:
 * - All orders and order items
 * - All users (customers)
 * - All leads
 * - All campaign hits
 * - All contact messages
 * 
 * Usage: npx tsx scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🧹 Starting cleanup of test data...\n");

  try {
    // Delete in correct order due to foreign key constraints

    console.log("1️⃣ Deleting order items...");
    const orderItemsDeleted = await prisma.orderItem.deleteMany({});
    console.log(`   ✅ Deleted ${orderItemsDeleted.count} order items\n`);

    console.log("2️⃣ Deleting orders...");
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`   ✅ Deleted ${ordersDeleted.count} orders\n`);

    console.log("3️⃣ Deleting campaign hits...");
    const campaignHitsDeleted = await prisma.campaignHit.deleteMany({});
    console.log(`   ✅ Deleted ${campaignHitsDeleted.count} campaign hits\n`);

    console.log("4️⃣ Deleting users (customers)...");
    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${usersDeleted.count} users\n`);

    console.log("5️⃣ Deleting leads...");
    const leadsDeleted = await prisma.lead.deleteMany({});
    console.log(`   ✅ Deleted ${leadsDeleted.count} leads\n`);

    console.log("6️⃣ Deleting contact messages...");
    const messagesDeleted = await prisma.contactMessage.deleteMany({});
    console.log(`   ✅ Deleted ${messagesDeleted.count} contact messages\n`);

    console.log("✨ Cleanup completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Order Items: ${orderItemsDeleted.count}`);
    console.log(`   - Orders: ${ordersDeleted.count}`);
    console.log(`   - Campaign Hits: ${campaignHitsDeleted.count}`);
    console.log(`   - Users: ${usersDeleted.count}`);
    console.log(`   - Leads: ${leadsDeleted.count}`);
    console.log(`   - Messages: ${messagesDeleted.count}`);
    console.log(`   Total records deleted: ${
      orderItemsDeleted.count +
      ordersDeleted.count +
      campaignHitsDeleted.count +
      usersDeleted.count +
      leadsDeleted.count +
      messagesDeleted.count
    }\n`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData()
  .then(() => {
    console.log("👋 Goodbye!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
