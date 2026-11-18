import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/api/app'
import { connectTestDb, clearTestDb, closeTestDb } from './setup'
import { User } from '../src/models/user.model'

beforeAll(async () => {
  await connectTestDb()
})

afterEach(async () => {
  await clearTestDb()
})

afterAll(async () => {
  await closeTestDb()
})

describe('POST /api/auth/register', () => {
  const validUserPayload = {
    email: 'nicolas@helpup.test',
    password: 'password123',
    firstName: 'Nicolas',
    lastName: 'Contreras',
    phone: '0612345678',
    city: 'Paris',
    bio: 'Développeur passionné',
    skills: ['informatique', 'bricolage'],
  }

  test('Nominal: inscription réussie renvoie 201 avec { user, token }', async () => {
    const res = await request(app).post('/api/auth/register').send(validUserPayload)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(typeof res.body.token).toBe('string')
    expect(res.body).toHaveProperty('user')

    const { user } = res.body
    expect(user.id).toBeDefined()
    expect(user.email).toBe('nicolas@helpup.test')
    expect(user.firstName).toBe('Nicolas')
    expect(user.lastName).toBe('Contreras')
    expect(user.phone).toBe('0612345678')
    expect(user.city).toBe('Paris')
    expect(user.bio).toBe('Développeur passionné')
    expect(user.skills).toEqual(['informatique', 'bricolage'])
    expect(user.role).toBe('client')
    expect(user.createdAt).toBeDefined()
    expect(user.updatedAt).toBeDefined()

    // Vérifier les règles de sécurité
    expect(user.password).toBeUndefined()
    expect(user.passwordHash).toBeUndefined()
    expect(user._id).toBeUndefined()
    expect(user.__v).toBeUndefined()

    // Vérifier la base de données
    const dbUser = await User.findOne({ email: 'nicolas@helpup.test' }).select('+passwordHash')
    expect(dbUser).not.toBeNull()
    expect(dbUser?.passwordHash).not.toBe('password123')
    expect(dbUser?.passwordHash.startsWith('$2')).toBe(true)
  })

  test('Impossible de s’inscrire en admin : un champ role renvoie 400 INVALID_INPUT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUserPayload, email: 'pirate@helpup.test', role: 'admin' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
    expect(await User.exists({ email: 'pirate@helpup.test' })).toBeNull()
  })

  test('Compétence hors catalogue renvoie 400 INVALID_INPUT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUserPayload, skills: ['piratage'] })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })

  test('L’email est insensible à la casse et converti en minuscules', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUserPayload,
        email: 'NICOLAS.Cap@HelpUp.Test',
      })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('nicolas.cap@helpup.test')
  })

  test('Email déjà utilisé renvoie 409 EMAIL_ALREADY_USED', async () => {
    await request(app).post('/api/auth/register').send(validUserPayload)

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUserPayload,
        email: 'NICOLAS@helpup.test',
      })

    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_USED',
        message: 'Cet email est déjà utilisé',
      },
    })
  })

  test('Mot de passe trop court (< 8 caractères) renvoie 400 INVALID_INPUT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUserPayload,
        password: 'short',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })

  test('Email invalide renvoie 400 INVALID_INPUT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUserPayload,
        email: 'not-an-email',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })

  test('Champ inconnu renvoie 400 INVALID_INPUT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUserPayload,
        unknownField: 'bad',
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'user@helpup.test',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Dupont',
    })
  })

  describe('POST /api/auth/refresh', () => {
    let token: string
    let userId: string

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'refresh@helpup.test',
        password: 'password123',
        firstName: 'Jean',
        lastName: 'Dupont',
      })
      token = res.body.token
      userId = res.body.user.id
    })

    test('Renvoie un nouveau JWT utilisable avec un jeton valide', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(typeof res.body.token).toBe('string')

      const me = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${res.body.token}`)
      expect(me.status).toBe(200)
      expect(me.body.id).toBe(userId)
    })

    test('Refuse le renouvellement sans JWT', async () => {
      const res = await request(app).post('/api/auth/refresh')

      expect(res.status).toBe(401)
    })

    test('Refuse le renouvellement avec un JWT expiré', async () => {
      const expiredToken = jwt.sign({}, 'test-only-secret-never-used-outside-jest', {
        algorithm: 'HS256',
        subject: userId,
        issuer: 'helpup-api',
        audience: 'helpup-web',
        expiresIn: -1,
      })

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(res.status).toBe(401)
    })
  })

  test('Nominal: connexion réussie renvoie 200 avec { user, token }', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@helpup.test',
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.email).toBe('user@helpup.test')
    expect(res.body.user.firstName).toBe('Jean')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  test('Connexion insensible à la casse de l’email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'USER@HelpUP.TEST',
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('user@helpup.test')
  })

  test('Mot de passe incorrect renvoie 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user@helpup.test',
      password: 'wrongpassword',
    })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Email ou mot de passe incorrect',
      },
    })
  })

  test('Email inexistant renvoie 401 UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@helpup.test',
      password: 'password123',
    })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Email ou mot de passe incorrect',
      },
    })
  })
})
