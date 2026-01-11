"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../src/routes/auth"));
const prisma_1 = __importDefault(require("../src/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
describe('Auth routes', () => {
    let testCampus;
    beforeAll(async () => {
        // Create test campus
        testCampus = await prisma_1.default.campus.create({
            data: {
                name: 'Test University',
                code: 'testu',
            },
        });
    });
    afterAll(async () => {
        await prisma_1.default.user.deleteMany({ where: { email: { contains: 'test@' } } });
        await prisma_1.default.campus.delete({ where: { id: testCampus.id } });
        await prisma_1.default.$disconnect();
    });
    describe('POST /register', () => {
        it('rejects non .edu emails', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: 'user@gmail.com',
                password: 'password123',
                campusId: testCampus.id,
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('.edu');
        });
        it('rejects short passwords', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: 'test@university.edu',
                password: 'short',
                campusId: testCampus.id,
            });
            expect(res.status).toBe(400);
        });
        it('creates user with valid .edu email', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: 'test@university.edu',
                password: 'password123',
                name: 'Test User',
                campusId: testCampus.id,
            });
            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            // Cleanup
            await prisma_1.default.user.deleteMany({ where: { email: 'test@university.edu' } });
        });
        it('rejects duplicate emails', async () => {
            await prisma_1.default.user.create({
                data: {
                    email: 'duplicate@university.edu',
                    passwordHash: await bcrypt_1.default.hash('password123', 10),
                    campusId: testCampus.id,
                    isVerified: false,
                },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: 'duplicate@university.edu',
                password: 'password123',
                campusId: testCampus.id,
            });
            expect(res.status).toBe(400);
            // Cleanup
            await prisma_1.default.user.deleteMany({ where: { email: 'duplicate@university.edu' } });
        });
    });
    describe('POST /login', () => {
        let testUser;
        beforeEach(async () => {
            testUser = await prisma_1.default.user.create({
                data: {
                    email: 'logintest@university.edu',
                    passwordHash: await bcrypt_1.default.hash('password123', 10),
                    campusId: testCampus.id,
                    isVerified: true,
                },
            });
        });
        afterEach(async () => {
            await prisma_1.default.user.deleteMany({ where: { email: 'logintest@university.edu' } });
        });
        it('rejects unverified users', async () => {
            await prisma_1.default.user.update({
                where: { id: testUser.id },
                data: { isVerified: false },
            });
            const res = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'logintest@university.edu',
                password: 'password123',
            });
            expect(res.status).toBe(403);
        });
        it('rejects wrong password', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'logintest@university.edu',
                password: 'wrongpassword',
            });
            expect(res.status).toBe(401);
        });
        it('returns tokens for valid credentials', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'logintest@university.edu',
                password: 'password123',
            });
            expect(res.status).toBe(200);
            expect(res.body.accessToken).toBeDefined();
            expect(res.body.refreshToken).toBeDefined();
            expect(res.body.user).toBeDefined();
        });
    });
});
