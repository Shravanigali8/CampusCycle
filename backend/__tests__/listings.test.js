"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const listings_1 = __importDefault(require("../src/routes/listings"));
const auth_1 = __importDefault(require("../src/routes/auth"));
const auth_2 = require("../src/middleware/auth");
const prisma_1 = __importDefault(require("../src/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
app.use('/listings', auth_2.authRequired, listings_1.default);
describe('Listing routes', () => {
    let testCampus;
    let testUser;
    let authToken;
    beforeAll(async () => {
        testCampus = await prisma_1.default.campus.create({
            data: {
                name: 'Test University',
                code: 'testu',
            },
        });
        testUser = await prisma_1.default.user.create({
            data: {
                email: 'testuser@university.edu',
                passwordHash: await bcrypt_1.default.hash('password123', 10),
                campusId: testCampus.id,
                isVerified: true,
            },
            include: { campus: true },
        });
        authToken = jsonwebtoken_1.default.sign({ sub: testUser.id, role: testUser.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '15m' });
    });
    afterAll(async () => {
        await prisma_1.default.listing.deleteMany({ where: { sellerId: testUser.id } });
        await prisma_1.default.user.deleteMany({ where: { email: 'testuser@university.edu' } });
        await prisma_1.default.campus.delete({ where: { id: testCampus.id } });
        await prisma_1.default.$disconnect();
    });
    describe('POST /listings', () => {
        it('creates a listing with valid data', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/listings')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Test Textbook',
                description: 'A test textbook',
                category: 'textbooks',
                condition: 'good',
                price: 25.0,
                isGiveaway: false,
                status: 'AVAILABLE',
            });
            expect(res.status).toBe(201);
            expect(res.body.listing).toBeDefined();
            expect(res.body.listing.title).toBe('Test Textbook');
            expect(res.body.listing.price).toBe(25.0);
            // Cleanup
            await prisma_1.default.listing.delete({ where: { id: res.body.listing.id } });
        });
        it('creates a giveaway listing', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/listings')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Free Chair',
                description: 'Free chair giveaway',
                category: 'furniture',
                condition: 'good',
                price: 0,
                isGiveaway: true,
                status: 'AVAILABLE',
            });
            expect(res.status).toBe(201);
            expect(res.body.listing.isGiveaway).toBe(true);
            expect(res.body.listing.price).toBe(0);
            // Cleanup
            await prisma_1.default.listing.delete({ where: { id: res.body.listing.id } });
        });
        it('rejects invalid data', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/listings')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: '',
                description: 'Missing title',
                category: 'textbooks',
                condition: 'good',
                price: 25.0,
            });
            expect(res.status).toBe(400);
        });
        it('requires authentication', async () => {
            const res = await (0, supertest_1.default)(app).post('/listings').send({
                title: 'Test',
                description: 'Test',
                category: 'textbooks',
                condition: 'good',
                price: 25.0,
            });
            expect(res.status).toBe(401);
        });
    });
    describe('GET /listings', () => {
        let testListing;
        beforeAll(async () => {
            testListing = await prisma_1.default.listing.create({
                data: {
                    title: 'Test Listing for GET',
                    description: 'Test description',
                    category: 'textbooks',
                    condition: 'good',
                    price: 20.0,
                    isGiveaway: false,
                    status: 'AVAILABLE',
                    campusId: testCampus.id,
                    sellerId: testUser.id,
                },
            });
        });
        afterAll(async () => {
            await prisma_1.default.listing.delete({ where: { id: testListing.id } });
        });
        it('returns listings for the user campus', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/listings')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.listings).toBeInstanceOf(Array);
            expect(res.body.listings.length).toBeGreaterThan(0);
        });
        it('filters by category', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/listings?category=textbooks')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            res.body.listings.forEach((listing) => {
                expect(listing.category).toBe('textbooks');
            });
        });
        it('filters by giveaway status', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/listings?isGiveaway=true')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            res.body.listings.forEach((listing) => {
                expect(listing.isGiveaway).toBe(true);
            });
        });
    });
});
