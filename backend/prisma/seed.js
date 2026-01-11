"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../src/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function main() {
    console.log('Seeding database...');
    // Clean existing data
    await prisma_1.default.message.deleteMany();
    await prisma_1.default.chatThread.deleteMany();
    await prisma_1.default.listingImage.deleteMany();
    await prisma_1.default.listing.deleteMany();
    await prisma_1.default.report.deleteMany();
    await prisma_1.default.block.deleteMany();
    await prisma_1.default.user.deleteMany();
    await prisma_1.default.campus.deleteMany();
    const passwordHash = await bcrypt_1.default.hash('password123', 10);
    // Create 2 campuses
    const stateU = await prisma_1.default.campus.create({
        data: {
            name: 'State University',
            code: 'stateu',
        },
    });
    const techU = await prisma_1.default.campus.create({
        data: {
            name: 'Tech University',
            code: 'techu',
        },
    });
    // Create 5 users (3 at StateU, 2 at TechU)
    const alice = await prisma_1.default.user.create({
        data: {
            email: 'alice@stateu.edu',
            name: 'Alice Johnson',
            passwordHash,
            campusId: stateU.id,
            isVerified: true,
            role: 'ADMIN',
        },
    });
    const bob = await prisma_1.default.user.create({
        data: {
            email: 'bob@stateu.edu',
            name: 'Bob Smith',
            passwordHash,
            campusId: stateU.id,
            isVerified: true,
        },
    });
    const charlie = await prisma_1.default.user.create({
        data: {
            email: 'charlie@stateu.edu',
            name: 'Charlie Brown',
            passwordHash,
            campusId: stateU.id,
            isVerified: true,
        },
    });
    const diana = await prisma_1.default.user.create({
        data: {
            email: 'diana@techu.edu',
            name: 'Diana Prince',
            passwordHash,
            campusId: techU.id,
            isVerified: true,
        },
    });
    const eve = await prisma_1.default.user.create({
        data: {
            email: 'eve@techu.edu',
            name: 'Eve Wilson',
            passwordHash,
            campusId: techU.id,
            isVerified: true,
        },
    });
    // Create listings for StateU
    const listing1 = await prisma_1.default.listing.create({
        data: {
            title: 'Calculus Textbook - Used but Good',
            description: 'Calculus textbook used for one semester. Good condition with some highlighting.',
            category: 'textbooks',
            condition: 'good',
            price: 15.0,
            isGiveaway: false,
            status: 'AVAILABLE',
            location: 'State University Library',
            zipcode: '12345',
            campusId: stateU.id,
            sellerId: alice.id,
            images: {
                create: [{ url: '/uploads/calc-book.jpg' }],
            },
        },
    });
    const listing2 = await prisma_1.default.listing.create({
        data: {
            title: 'Free Desk Chair',
            description: 'Office chair in good condition. Moving out and need to get rid of it.',
            category: 'furniture',
            condition: 'good',
            price: 0,
            isGiveaway: true,
            status: 'AVAILABLE',
            location: 'State University Dorms',
            zipcode: '12345',
            campusId: stateU.id,
            sellerId: bob.id,
            images: {
                create: [{ url: '/uploads/chair.jpg' }],
            },
        },
    });
    const listing3 = await prisma_1.default.listing.create({
        data: {
            title: 'Laptop - Slightly Used',
            description: 'MacBook Pro 13" from 2020. Still works great, just upgrading.',
            category: 'electronics',
            condition: 'excellent',
            price: 450.0,
            isGiveaway: false,
            status: 'CLAIMED',
            location: 'State University Campus',
            zipcode: '12345',
            campusId: stateU.id,
            sellerId: charlie.id,
            images: {
                create: [{ url: '/uploads/laptop.jpg' }],
            },
        },
    });
    // Create listings for TechU
    const listing4 = await prisma_1.default.listing.create({
        data: {
            title: 'Programming Textbooks Bundle',
            description: 'Data Structures, Algorithms, and OS books. All in great condition.',
            category: 'textbooks',
            condition: 'excellent',
            price: 50.0,
            isGiveaway: false,
            status: 'AVAILABLE',
            location: 'Tech University Bookstore',
            zipcode: '54321',
            campusId: techU.id,
            sellerId: diana.id,
            images: {
                create: [{ url: '/uploads/cs-books.jpg' }],
            },
        },
    });
    const listing5 = await prisma_1.default.listing.create({
        data: {
            title: 'Free Plant Collection',
            description: 'Moving out and can\'t take my plants. Free to good home!',
            category: 'other',
            condition: 'good',
            price: 0,
            isGiveaway: true,
            status: 'AVAILABLE',
            location: 'Tech University Apartments',
            zipcode: '54321',
            campusId: techU.id,
            sellerId: eve.id,
            images: {
                create: [{ url: '/uploads/plants.jpg' }],
            },
        },
    });
    // Create a chat thread for listing1 (Bob messaging Alice about the textbook)
    const thread1 = await prisma_1.default.chatThread.create({
        data: {
            listingId: listing1.id,
            buyerId: bob.id,
            sellerId: alice.id,
            messages: {
                create: [
                    {
                        senderId: bob.id,
                        body: 'Hi! Is the calculus textbook still available?',
                    },
                    {
                        senderId: alice.id,
                        body: 'Yes, it is! Would you like to meet up tomorrow?',
                        readAt: new Date(),
                    },
                ],
            },
        },
    });
    console.log('\n✅ Seeding complete!');
    console.log('\n📝 Test Accounts (all passwords: password123):');
    console.log('  1. alice@stateu.edu (Admin at State University)');
    console.log('  2. bob@stateu.edu (Student at State University)');
    console.log('  3. charlie@stateu.edu (Student at State University)');
    console.log('  4. diana@techu.edu (Student at Tech University)');
    console.log('  5. eve@techu.edu (Student at Tech University)');
    console.log('\n🏫 Campuses:');
    console.log('  - State University (stateu)');
    console.log('  - Tech University (techu)');
}
main()
    .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
