import request from 'supertest'
import express from 'express'
import listingRoutes from '../src/routes/listings'
import authRoutes from '../src/routes/auth'
import { authRequired } from '../src/middleware/auth'
import prisma from '../src/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/listings', authRequired, listingRoutes)

describe('Listing routes', () => {
  let testCampus: any
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    testCampus = await prisma.campus.create({
      data: {
        name: 'Test University',
        code: 'testu',
      },
    })

    testUser = await prisma.user.create({
      data: {
        email: 'testuser@university.edu',
        passwordHash: await bcrypt.hash('password123', 10),
        campusId: testCampus.id,
        isVerified: true,
      },
      include: { campus: true },
    })

    authToken = jwt.sign(
      { sub: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '15m' }
    )
  })

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { sellerId: testUser.id } })
    await prisma.user.deleteMany({ where: { email: 'testuser@university.edu' } })
    await prisma.campus.delete({ where: { id: testCampus.id } })
    await prisma.$disconnect()
  })

  describe('POST /listings', () => {
    it('creates a listing with valid data', async () => {
      const res = await request(app)
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
        })

      expect(res.status).toBe(201)
      expect(res.body.listing).toBeDefined()
      expect(res.body.listing.title).toBe('Test Textbook')
      expect(res.body.listing.price).toBe(25.0)

      // Cleanup
      await prisma.listing.delete({ where: { id: res.body.listing.id } })
    })

    it('creates a giveaway listing', async () => {
      const res = await request(app)
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
        })

      expect(res.status).toBe(201)
      expect(res.body.listing.isGiveaway).toBe(true)
      expect(res.body.listing.price).toBe(0)

      // Cleanup
      await prisma.listing.delete({ where: { id: res.body.listing.id } })
    })

    it('rejects invalid data', async () => {
      const res = await request(app)
        .post('/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          description: 'Missing title',
          category: 'textbooks',
          condition: 'good',
          price: 25.0,
        })

      expect(res.status).toBe(400)
    })

    it('requires authentication', async () => {
      const res = await request(app).post('/listings').send({
        title: 'Test',
        description: 'Test',
        category: 'textbooks',
        condition: 'good',
        price: 25.0,
      })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /listings', () => {
    let testListing: any

    beforeAll(async () => {
      testListing = await prisma.listing.create({
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
      })
    })

    afterAll(async () => {
      await prisma.listing.delete({ where: { id: testListing.id } })
    })

    it('returns listings for the user campus', async () => {
      const res = await request(app)
        .get('/listings')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.listings).toBeInstanceOf(Array)
      expect(res.body.listings.length).toBeGreaterThan(0)
    })

    it('filters by category', async () => {
      const res = await request(app)
        .get('/listings?category=textbooks')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      res.body.listings.forEach((listing: any) => {
        expect(listing.category).toBe('textbooks')
      })
    })

    it('filters by giveaway status', async () => {
      const res = await request(app)
        .get('/listings?isGiveaway=true')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      res.body.listings.forEach((listing: any) => {
        expect(listing.isGiveaway).toBe(true)
      })
    })
  })
})

