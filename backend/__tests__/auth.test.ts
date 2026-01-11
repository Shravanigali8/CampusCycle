import request from 'supertest'
import express from 'express'
import authRoutes from '../src/routes/auth'
import prisma from '../src/prisma'
import bcrypt from 'bcrypt'

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

describe('Auth routes', () => {
  let testCampus: any

  beforeAll(async () => {
    // Create test campus
    testCampus = await prisma.campus.create({
      data: {
        name: 'Test University',
        code: 'testu',
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } })
    await prisma.campus.delete({ where: { id: testCampus.id } })
    await prisma.$disconnect()
  })

  describe('POST /register', () => {
    it('rejects non .edu emails', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'user@gmail.com',
          password: 'password123',
          campusId: testCampus.id,
        })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('.edu')
    })

    it('rejects short passwords', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'short',
          campusId: testCampus.id,
        })
      expect(res.status).toBe(400)
    })

    it('creates user with valid .edu email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@university.edu',
          password: 'password123',
          name: 'Test User',
          campusId: testCampus.id,
        })
      expect(res.status).toBe(201)
      expect(res.body.ok).toBe(true)

      // Cleanup
      await prisma.user.deleteMany({ where: { email: 'test@university.edu' } })
    })

    it('rejects duplicate emails', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@university.edu',
          passwordHash: await bcrypt.hash('password123', 10),
          campusId: testCampus.id,
          isVerified: false,
        },
      })

      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@university.edu',
          password: 'password123',
          campusId: testCampus.id,
        })
      expect(res.status).toBe(400)

      // Cleanup
      await prisma.user.deleteMany({ where: { email: 'duplicate@university.edu' } })
    })
  })

  describe('POST /login', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'logintest@university.edu',
          passwordHash: await bcrypt.hash('password123', 10),
          campusId: testCampus.id,
          isVerified: true,
        },
      })
    })

    afterEach(async () => {
      await prisma.user.deleteMany({ where: { email: 'logintest@university.edu' } })
    })

    it('rejects unverified users', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isVerified: false },
      })

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'logintest@university.edu',
          password: 'password123',
        })
      expect(res.status).toBe(403)
    })

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'logintest@university.edu',
          password: 'wrongpassword',
        })
      expect(res.status).toBe(401)
    })

    it('returns tokens for valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'logintest@university.edu',
          password: 'password123',
        })
      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.user).toBeDefined()
    })
  })
})
