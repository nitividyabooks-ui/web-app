const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper function to generate a random date within the last N days
function getRandomDateInLastDays(days) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
    return new Date(randomTime);
}

// Sample reviews for products
const reviews = [
    // Miko Meets Animals
    {
        productId: "miko-meets-animals",
        rating: 5,
        title: "My toddler's favorite book!",
        content: "My 2-year-old absolutely loves this book. She asks for it every night before bed. The illustrations are beautiful and she's already learning animal names in both Hindi and English!",
        authorName: "Priya Sharma",
        authorCity: "Mumbai",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-meets-animals",
        rating: 5,
        title: "Perfect for bilingual learning",
        content: "As an NRI family, we wanted our kids to learn Hindi naturally. This book is perfect - my son loves pointing at the animals and saying their names in both languages.",
        authorName: "Rahul Patel",
        authorCity: "Bangalore",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-meets-animals",
        rating: 4,
        title: "Great quality, sturdy pages",
        content: "The book quality is excellent. My baby loves to chew on books and this one has held up really well. The colors are vibrant and catch her attention.",
        authorName: "Ananya Reddy",
        authorCity: "Hyderabad",
        isVerified: true,
        isApproved: true,
    },

    // Miko Celebrates Festivals
    {
        productId: "miko-celebrates-festivals",
        rating: 5,
        title: "Beautiful way to teach culture",
        content: "Finally found a book that introduces Indian festivals to my toddler in a simple, age-appropriate way. The Diwali and Holi pages are her favorites!",
        authorName: "Meera Krishnan",
        authorCity: "Chennai",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-celebrates-festivals",
        rating: 5,
        title: "Grandparents approved!",
        content: "My parents (the grandparents) love reading this to my daughter. It's become their special bonding activity. The illustrations are so colorful and joyful.",
        authorName: "Sneha Gupta",
        authorCity: "Delhi",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-celebrates-festivals",
        rating: 4,
        title: "Great concept, well executed",
        content: "Love how each festival is explained simply. My 3-year-old now gets excited about festivals because of this book. Would love more pages!",
        authorName: "Vikram Singh",
        authorCity: "Jaipur",
        isVerified: false,
        isApproved: true,
    },

    // Miko Learns Actions
    {
        productId: "miko-learns-actions",
        rating: 5,
        title: "Interactive and fun!",
        content: "This book has become a game for us! My son loves acting out the actions - jumping, clapping, running. It's helping him learn verbs while being active.",
        authorName: "Kavitha Nair",
        authorCity: "Kochi",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-learns-actions",
        rating: 5,
        title: "Speech therapist recommended",
        content: "Our speech therapist suggested action words for vocabulary building. This book is perfect! Simple illustrations, clear words in both languages.",
        authorName: "Deepa Menon",
        authorCity: "Pune",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-learns-actions",
        rating: 4,
        title: "Toddler approved",
        content: "My 18-month-old points at the pictures and tries to do the actions. It's adorable! Good quality book that survives rough handling.",
        authorName: "Arun Kumar",
        authorCity: "Coimbatore",
        isVerified: true,
        isApproved: true,
    },

    // Gods and Goddesses
    {
        productId: "gods-and-goddesses",
        rating: 5,
        title: "Perfect introduction to mythology",
        content: "I was looking for a way to introduce Hindu gods to my child without overwhelming her. This book does it beautifully - simple, colorful, and age-appropriate.",
        authorName: "Lakshmi Iyer",
        authorCity: "Bangalore",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "gods-and-goddesses",
        rating: 5,
        title: "Grandma's favorite gift",
        content: "My mother gifted this to my son and now it's his favorite. He recognizes Ganesha and Hanuman everywhere! Beautiful illustrations.",
        authorName: "Ravi Shankar",
        authorCity: "Lucknow",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "gods-and-goddesses",
        rating: 4,
        title: "Well designed for little ones",
        content: "The illustrations are child-friendly without being cartoonish. My daughter loves the bright colors. Good quality paperback.",
        authorName: "Sunita Joshi",
        authorCity: "Ahmedabad",
        isVerified: false,
        isApproved: true,
    },

    // Miko Learns Manners
    {
        productId: "miko-learns-manners",
        rating: 5,
        title: "Teaching manners made easy",
        content: "This book has been a game-changer! My son now says 'please' and 'thank you' because he learned it from Miko. The situations are so relatable.",
        authorName: "Pooja Mehta",
        authorCity: "Surat",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-learns-manners",
        rating: 5,
        title: "Reinforces what we teach at home",
        content: "Perfect companion to our parenting. When my daughter doesn't want to share, we read the sharing page together. It really helps!",
        authorName: "Neha Agarwal",
        authorCity: "Kolkata",
        isVerified: true,
        isApproved: true,
    },
    {
        productId: "miko-learns-manners",
        rating: 4,
        title: "Good for preschoolers",
        content: "My 4-year-old's preschool teacher noticed improvement in his manners. We read this book every day. Simple and effective.",
        authorName: "Amit Verma",
        authorCity: "Noida",
        isVerified: true,
        isApproved: true,
    },
];

// Sample testimonials for homepage
const testimonials = [
    {
        content: "These books have become an essential part of our bedtime routine. My daughter asks for Miko every night! The bilingual aspect is helping her learn Hindi naturally.",
        authorName: "Priya Sharma",
        authorTitle: "Mother of 2, Mumbai",
        rating: 5,
        isActive: true,
        sortOrder: 1,
    },
    {
        content: "As a preschool teacher, I've seen many children's books. NitiVidya books stand out for their quality, safety, and thoughtful content. I recommend them to all parents.",
        authorName: "Kavitha Nair",
        authorTitle: "Preschool Teacher, Kochi",
        rating: 5,
        isActive: true,
        sortOrder: 2,
    },
    {
        content: "Finally, books that reflect our culture! My son loves learning about festivals and gods through these beautiful illustrations. The book quality is excellent.",
        authorName: "Rahul Patel",
        authorTitle: "Father of 1, Bangalore",
        rating: 5,
        isActive: true,
        sortOrder: 3,
    },
    {
        content: "My 18-month-old has been teething and chewing on everything. These books have survived it all! Safe, durable, and educational - exactly what we needed.",
        authorName: "Ananya Reddy",
        authorTitle: "First-time Mom, Hyderabad",
        rating: 5,
        isActive: true,
        sortOrder: 4,
    },
    {
        content: "The Miko series has helped my daughter build vocabulary in both Hindi and English. She now points at animals and says their names in both languages!",
        authorName: "Meera Krishnan",
        authorTitle: "Mother of 1, Chennai",
        rating: 5,
        isActive: true,
        sortOrder: 5,
    },
    {
        content: "Gift-worthy quality and packaging. I've given these books to three different families and everyone loves them. Perfect for baby showers!",
        authorName: "Sneha Gupta",
        authorTitle: "Aunt & Book Lover, Delhi",
        rating: 5,
        isActive: true,
        sortOrder: 6,
    },
];

async function main() {
    console.log("🌱 Seeding reviews and testimonials...\n");

    // Clear existing data
    console.log("Clearing existing reviews and testimonials...");
    await prisma.review.deleteMany({});
    await prisma.testimonial.deleteMany({});

    // Seed reviews with random dates from the last 30 days
    console.log("\n📝 Seeding reviews...");
    for (const review of reviews) {
        try {
            const randomDate = getRandomDateInLastDays(30);
            await prisma.review.create({
                data: {
                    ...review,
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
                data: testimonial,
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

