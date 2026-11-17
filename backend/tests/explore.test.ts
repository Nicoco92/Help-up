import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import app from '../src/app'

const jwtSecret = 'explore-test-secret'
let mongoServer: MongoMemoryServer

function tokenFor(userId: Types.ObjectId) {
  return jwt.sign({ sub: userId.toHexString() }, jwtSecret, { expiresIn: 3600 })
}

function makeMission(ownerId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return {
    ownerId,
    title: 'Mission de bricolage',
    description: 'Un coup de main pour monter un meuble.',
    rewardCents: 3200,
    estimatedMinutes: 60,
    category: 'bricolage',
    scheduledAt: new Date('2027-01-15T10:00:00.000Z'),
    quartier: 'paris-13-butte-aux-cailles',
    location: { type: 'Point', coordinates: [2.35, 48.827] },
    status: 'open',
    urgent: false,
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    ...overrides,
  }
}

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  await mongoose.connection.collection('missions').createIndex(
    { title: 'text', description: 'text' },
    { default_language: 'french' },
  )
})

beforeEach(async () => {
  await Promise.all([
    mongoose.connection.collection('users').deleteMany({}),
    mongoose.connection.collection('missions').deleteMany({}),
    mongoose.connection.collection('applications').deleteMany({}),
  ])
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

describe('GET /api/explore/missions', () => {
  test('requiert un JWT et retourne uniquement les missions ouvertes des autres membres', async () => {
    const viewer = new Types.ObjectId()
    const owner = new Types.ObjectId()
    await mongoose.connection.collection('users').insertOne({
      _id: owner,
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.test',
    })
    await mongoose.connection.collection('missions').insertMany([
      makeMission(owner),
      makeMission(viewer, { title: 'Ma mission à moi' }),
      makeMission(owner, { title: 'Mission attribuée', status: 'assigned' }),
    ])

    const unauthorized = await request(app).get('/api/explore/missions')
    expect(unauthorized.status).toBe(401)
    expect(unauthorized.body.error.code).toBe('UNAUTHORIZED')

    const response = await request(app)
      .get('/api/explore/missions')
      .set('Authorization', `Bearer ${tokenFor(viewer)}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      id: expect.any(String),
      title: 'Mission de bricolage',
      owner: { id: owner.toHexString(), firstName: 'Alice' },
      categoryLabel: 'Bricolage',
    })
    expect(response.body.items[0]).not.toHaveProperty('_id')
    expect(response.body.items[0].owner).not.toHaveProperty('email')
    expect(response.body.items[0].owner).not.toHaveProperty('lastName')
  })

  test('applique les filtres par texte, catégorie et intervalle de prime', async () => {
    const viewer = new Types.ObjectId()
    const owner = new Types.ObjectId()
    await mongoose.connection.collection('missions').insertMany([
      makeMission(owner, {
        title: 'Garde de chat ce week-end',
        description: 'Nourrir le chat et jouer avec lui.',
        category: 'animaux',
        rewardCents: 3500,
      }),
      makeMission(owner, { title: 'Garde de chien', category: 'animaux', rewardCents: 4200 }),
      makeMission(owner, { title: 'Garde de chat hors budget', category: 'animaux', rewardCents: 5200 }),
    ])

    const response = await request(app)
      .get('/api/explore/missions?q=chat&category=animaux&minReward=30&maxReward=40')
      .set('Authorization', `Bearer ${tokenFor(viewer)}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].title).toBe('Garde de chat ce week-end')
  })

  test('trouve aussi un préfixe de mot dans le titre', async () => {
    const viewer = new Types.ObjectId()
    const owner = new Types.ObjectId()
    await mongoose.connection.collection('missions').insertOne(
      makeMission(owner, {
        title: 'Baby sitter samedi soir',
        category: 'garde-enfants',
        description: 'Garde de deux enfants à domicile.',
      }),
    )

    const response = await request(app)
      .get('/api/explore/missions?q=bab')
      .set('Authorization', `Bearer ${tokenFor(viewer)}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].title).toBe('Baby sitter samedi soir')
  })

  test('rejette les filtres invalides', async () => {
    const response = await request(app)
      .get('/api/explore/missions?category=inconnue')
      .set('Authorization', `Bearer ${tokenFor(new Types.ObjectId())}`)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_INPUT')
  })

  test('place les missions urgentes avant le tri choisi', async () => {
    const viewer = new Types.ObjectId()
    const owner = new Types.ObjectId()
    await mongoose.connection.collection('missions').insertMany([
      makeMission(owner, {
        title: 'Mission non urgente',
        urgent: false,
        rewardCents: 1000,
        scheduledAt: new Date('2027-01-15T10:00:00.000Z'),
      }),
      makeMission(owner, {
        title: 'Mission urgente',
        urgent: true,
        rewardCents: 5000,
        scheduledAt: new Date('2026-12-15T10:00:00.000Z'),
      }),
    ])

    const response = await request(app)
      .get('/api/explore/missions?sort=reward_asc')
      .set('Authorization', `Bearer ${tokenFor(viewer)}`)

    expect(response.status).toBe(200)
    expect(response.body.items.map((mission: { title: string }) => mission.title)).toEqual([
      'Mission urgente',
      'Mission non urgente',
    ])
  })
})

describe('GET /api/explore/missions/:id', () => {
  test('retourne le détail et indique une candidature déjà envoyée', async () => {
    const viewer = new Types.ObjectId()
    const owner = new Types.ObjectId()
    const { insertedId } = await mongoose.connection
      .collection('missions')
      .insertOne(makeMission(owner))
    await mongoose.connection.collection('users').insertOne({
      _id: owner,
      firstName: 'Alice',
      email: 'alice@example.test',
    })
    await mongoose.connection.collection('applications').insertOne({
      missionId: insertedId,
      applicantId: viewer,
      status: 'pending',
      message: 'Je peux vous aider avec plaisir.',
    })

    const response = await request(app)
      .get(`/api/explore/missions/${insertedId.toHexString()}`)
      .set('Authorization', `Bearer ${tokenFor(viewer)}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: insertedId.toHexString(),
      alreadyApplied: true,
      owner: { firstName: 'Alice' },
    })
    expect(response.body).not.toHaveProperty('_id')
  })

  test('retourne 400 pour un identifiant mal formé et 404 pour sa propre mission', async () => {
    const viewer = new Types.ObjectId()
    const token = tokenFor(viewer)

    const invalidId = await request(app)
      .get('/api/explore/missions/not-an-object-id')
      .set('Authorization', `Bearer ${token}`)
    expect(invalidId.status).toBe(400)
    expect(invalidId.body.error.code).toBe('INVALID_INPUT')

    const { insertedId } = await mongoose.connection
      .collection('missions')
      .insertOne(makeMission(viewer))
    const ownMission = await request(app)
      .get(`/api/explore/missions/${insertedId.toHexString()}`)
      .set('Authorization', `Bearer ${token}`)
    expect(ownMission.status).toBe(404)
    expect(ownMission.body.error.code).toBe('NOT_FOUND')
  })
})
