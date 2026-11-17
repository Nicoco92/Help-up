import request from 'supertest'
import app from '../src/app'
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

describe('User Profile & Role API', () => {
  let clientToken: string
  let clientId: string
  let otherClientId: string
  let adminToken: string
  let adminId: string

  beforeEach(async () => {
    // 1. Client principal
    const clientRes = await request(app).post('/api/auth/register').send({
      email: 'client@helpup.test',
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: '0612345678',
      city: 'Paris 13',
      bio: 'Étudiante disponible',
      skills: ['bricolage'],
    })
    clientToken = clientRes.body.token
    clientId = clientRes.body.user.id

    // 2. Autre client
    const otherRes = await request(app).post('/api/auth/register').send({
      email: 'other@helpup.test',
      password: 'password123',
      firstName: 'Bob',
      lastName: 'Martin',
      phone: '0698765432',
      city: 'Paris 14',
      bio: 'Besoin de coups de main',
      skills: ['courses'],
    })
    otherClientId = otherRes.body.user.id

    // 3. Administrateur
    const adminRes = await request(app).post('/api/auth/register').send({
      email: 'admin@helpup.test',
      password: 'password123',
      firstName: 'Charlie',
      lastName: 'Admin',
    })
    adminToken = adminRes.body.token
    adminId = adminRes.body.user.id
    // L'inscription crée toujours un « client » : la promotion se fait en base, comme en production.
    await User.updateOne({ _id: adminId }, { role: 'admin' })
  })

  describe('GET /api/users/me', () => {
    test('Sans token renvoie 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/users/me')
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    test('Avec un token invalide renvoie 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    test('Nominal: renvoie le profil complet de l’utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(clientId)
      expect(res.body.email).toBe('client@helpup.test')
      expect(res.body.firstName).toBe('Alice')
      expect(res.body.lastName).toBe('Dupont')
      expect(res.body.phone).toBe('0612345678')
      expect(res.body.city).toBe('Paris 13')
      expect(res.body.bio).toBe('Étudiante disponible')
      expect(res.body.skills).toEqual(['bricolage'])
      expect(res.body.role).toBe('client')
      expect(res.body.passwordHash).toBeUndefined()
    })
  })

  describe('PATCH /api/users/me', () => {
    test('Nominal: mise à jour partielle des champs autorisés', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          firstName: 'Alice-Modifiée',
          city: 'Paris 15',
          bio: 'Nouvelle description',
          skills: ['bricolage', 'jardinage'],
        })

      expect(res.status).toBe(200)
      expect(res.body.firstName).toBe('Alice-Modifiée')
      expect(res.body.city).toBe('Paris 15')
      expect(res.body.bio).toBe('Nouvelle description')
      expect(res.body.skills).toEqual(['bricolage', 'jardinage'])
      expect(res.body.lastName).toBe('Dupont') // Conservé inchangé
    })

    test('Une chaîne vide efface un champ facultatif (téléphone)', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ phone: '' })

      expect(res.status).toBe(200)
      expect(res.body.phone).toBeUndefined()
    })

    test('Corps vide renvoie 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('Injecter un id ou ownerId renvoie 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          id: '507f1f77bcf86cd799439011',
          firstName: 'Hacker',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('Tenter de modifier email ou role renvoie 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email: 'newemail@helpup.test',
          role: 'admin',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })
  })

  describe('GET /api/users/:id', () => {
    test('Identifiant mal formé renvoie 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .get('/api/users/bad-id-123')
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('Utilisateur inexistant renvoie 404 NOT_FOUND', async () => {
      const res = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })

    test('Consultation du profil d’un tiers: données sensibles (email, téléphone, nom de famille entier) masquées', async () => {
      const res = await request(app)
        .get(`/api/users/${otherClientId}`)
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(otherClientId)
      expect(res.body.firstName).toBe('Bob')
      expect(res.body.lastName).toBe('M.') // Nom tronqué en initiale
      expect(res.body.city).toBe('Paris 14')
      expect(res.body.bio).toBe('Besoin de coups de main')
      expect(res.body.skills).toEqual(['courses'])
      expect(res.body.role).toBeUndefined()

      // Confidentialité
      expect(res.body.email).toBeUndefined()
      expect(res.body.phone).toBeUndefined()
      expect(res.body.passwordHash).toBeUndefined()
    })

    test('Consultation de son propre profil via :id: données complètes renvoyées', async () => {
      const res = await request(app)
        .get(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('client@helpup.test')
      expect(res.body.lastName).toBe('Dupont')
      expect(res.body.phone).toBe('0612345678')
    })

    test('Consultation par un administrateur: données complètes renvoyées', async () => {
      const res = await request(app)
        .get(`/api/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('client@helpup.test')
      expect(res.body.lastName).toBe('Dupont')
      expect(res.body.phone).toBe('0612345678')
    })
  })

  describe('Système de rôle (client vs admin)', () => {
    test('GET /api/users pour un admin renvoie tous les profils détaillés avec emails', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('items')
      expect(Array.isArray(res.body.items)).toBe(true)
      expect(res.body.items.length).toBe(3)

      const clientInList = res.body.items.find((u: { email?: string }) => u.email === 'client@helpup.test')
      expect(clientInList).toBeDefined()
      expect(clientInList.phone).toBe('0612345678')
    })

    test('GET /api/users pour un client renvoie uniquement les profils clients (admins exclus)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('items')
      expect(res.body.items.length).toBe(2) // 2 clients uniquement

      // Aucun compte admin dans la liste
      const adminInList = res.body.items.find((u: { role?: string }) => u.role === 'admin')
      expect(adminInList).toBeUndefined()

      // Les emails et téléphones sont masqués
      res.body.items.forEach((item: { id: string; email?: string; phone?: string }) => {
        expect(item.email).toBeUndefined()
        expect(item.phone).toBeUndefined()
        expect(item.id).not.toBe(adminId)
      })
    })

    test('GET /api/users liste aussi les comptes sans champ role (créés par seed-demo.js)', async () => {
      await User.collection.insertOne({
        email: 'demo@helpup.test',
        passwordHash: 'x'.repeat(60),
        firstName: 'Démo',
        lastName: 'Seed',
        skills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(200)
      expect(res.body.items.length).toBe(3)
      expect(res.body.items.some((u: { firstName: string }) => u.firstName === 'Démo')).toBe(true)
    })

    test('GET /api/users/:adminId par un client renvoie 404 NOT_FOUND (profil admin non consultable publiquement)', async () => {
      const res = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })

    test('PATCH /api/users/:id/role par un client renvoie 403 FORBIDDEN', async () => {
      const res = await request(app)
        .patch(`/api/users/${otherClientId}/role`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ role: 'admin' })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    test('PATCH /api/users/:id/role par un admin promeut un client en admin', async () => {
      const res = await request(app)
        .patch(`/api/users/${otherClientId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(otherClientId)
      expect(res.body.role).toBe('admin')

      // Vérifier que le rôle a bien changé en base
      const checkRes = await request(app)
        .get(`/api/users/${otherClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(checkRes.body.role).toBe('admin')
    })

    test('PATCH /api/users/:id/role sur son propre compte renvoie 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .patch(`/api/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'client' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })
  })
})
