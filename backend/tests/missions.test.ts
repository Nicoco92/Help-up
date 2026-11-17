import request from 'supertest'
import app from '../src/api/app'
import { connectTestDb, clearTestDb, closeTestDb } from './setup'
import { Mission } from '../src/models/mission.model'
import { Application } from '../src/models/application.model'
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

const inOneWeek = () => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

const validMission = () => ({
  title: 'Tondre la pelouse',
  description: 'Jardin de 200 m², tondeuse fournie. Ramassage compris.',
  rewardCents: 3000,
  estimatedMinutes: 90,
  category: 'jardinage',
  scheduledAt: inOneWeek(),
  quartier: 'villejuif-centre',
})

async function registerUser(email: string): Promise<{ token: string; id: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', firstName: 'Test', lastName: 'User' })
  return { token: res.body.token, id: res.body.user.id }
}

describe('/api/missions', () => {
  let tokenA: string
  let idA: string
  let tokenB: string

  const asA = () => ({ Authorization: `Bearer ${tokenA}` })
  const asB = () => ({ Authorization: `Bearer ${tokenB}` })

  async function createMissionAsA(overrides: Record<string, unknown> = {}) {
    const res = await request(app)
      .post('/api/missions')
      .set(asA())
      .send({ ...validMission(), ...overrides })
    expect(res.status).toBe(201)
    return res.body
  }

  beforeEach(async () => {
    ;({ token: tokenA, id: idA } = await registerUser('a@helpup.test'))
    ;({ token: tokenB } = await registerUser('b@helpup.test'))
  })

  describe('Sans JWT', () => {
    test.each([
      ['get', '/api/missions'],
      ['post', '/api/missions'],
      ['get', '/api/missions/6650f0c2a1b2c3d4e5f60789'],
      ['patch', '/api/missions/6650f0c2a1b2c3d4e5f60789'],
      ['delete', '/api/missions/6650f0c2a1b2c3d4e5f60789'],
    ] as const)('%s %s renvoie 401', async (method, url) => {
      const res = await request(app)[method](url)
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Parcours CRUD nominal', () => {
    test('créer, lister, lire, modifier puis supprimer', async () => {
      // Liste vide
      let res = await request(app).get('/api/missions').set(asA())
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ items: [] })

      // Création : champs serveur calculés, id exposé, jamais _id
      const created = await createMissionAsA()
      expect(created.id).toMatch(/^[a-f\d]{24}$/)
      expect(created._id).toBeUndefined()
      expect(created.ownerId).toBe(idA)
      expect(created.status).toBe('open')
      expect(created.providerId).toBeNull()
      expect(created.urgent).toBe(false)
      expect(created.location).toEqual({ type: 'Point', coordinates: [2.364, 48.7875] })

      // Liste
      res = await request(app).get('/api/missions').set(asA())
      expect(res.body.items).toHaveLength(1)
      expect(res.body.items[0].id).toBe(created.id)

      // Lecture
      res = await request(app).get(`/api/missions/${created.id}`).set(asA())
      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Tondre la pelouse')

      // Modification partielle : changer de quartier recalcule location
      res = await request(app)
        .patch(`/api/missions/${created.id}`)
        .set(asA())
        .send({ rewardCents: 3500, quartier: 'ivry-centre', urgent: true })
      expect(res.status).toBe(200)
      expect(res.body.rewardCents).toBe(3500)
      expect(res.body.urgent).toBe(true)
      expect(res.body.title).toBe('Tondre la pelouse')
      expect(res.body.location.coordinates).toEqual([2.387, 48.813])

      // Masquage (le membre ne supprime pas : il masque)
      res = await request(app).patch(`/api/missions/${created.id}`).set(asA()).send({ hidden: true })
      expect(res.status).toBe(200)
      expect(res.body.hidden).toBe(true)

      // Toujours visible pour son propriétaire
      res = await request(app).get('/api/missions').set(asA())
      expect(res.body.items).toHaveLength(1)
    })

    test('le filtre status ne garde que les missions de ce statut', async () => {
      const open = await createMissionAsA()
      const done = await createMissionAsA({ title: 'Monter une armoire' })
      await Mission.updateOne({ _id: done.id }, { status: 'completed' })

      const res = await request(app).get('/api/missions?status=open').set(asA())
      expect(res.status).toBe(200)
      expect(res.body.items.map((m: { id: string }) => m.id)).toEqual([open.id])
    })
  })

  describe('Données invalides → 400 INVALID_INPUT', () => {
    test.each([
      ['titre trop court', { title: 'abc' }],
      ['rémunération non entière', { rewardCents: 12.5 }],
      ['rémunération trop basse', { rewardCents: 100 }],
      ['catégorie inconnue', { category: 'plomberie' }],
      ['quartier inconnu', { quartier: 'lyon' }],
      ['date passée', { scheduledAt: '2020-01-01T10:00:00.000Z' }],
      ['date mal formée', { scheduledAt: 'demain' }],
      ['ownerId dans le corps', { ownerId: '6650f0c2a1b2c3d4e5f60789' }],
      ['id dans le corps', { id: '6650f0c2a1b2c3d4e5f60789' }],
      ['status dans le corps', { status: 'completed' }],
      ['champ inconnu', { color: 'rouge' }],
    ])('POST avec %s', async (_label, overrides) => {
      const res = await request(app)
        .post('/api/missions')
        .set(asA())
        .send({ ...validMission(), ...overrides })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('POST sans champ obligatoire', async () => {
      const withoutTitle: Partial<ReturnType<typeof validMission>> = validMission()
      delete withoutTitle.title
      const res = await request(app).post('/api/missions').set(asA()).send(withoutTitle)
      expect(res.status).toBe(400)
    })

    test('PATCH vide', async () => {
      const mission = await createMissionAsA()
      const res = await request(app).patch(`/api/missions/${mission.id}`).set(asA()).send({})
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('PATCH avec ownerId', async () => {
      const mission = await createMissionAsA()
      const res = await request(app)
        .patch(`/api/missions/${mission.id}`)
        .set(asA())
        .send({ ownerId: '6650f0c2a1b2c3d4e5f60789' })
      expect(res.status).toBe(400)
    })

    test.each(['get', 'patch'] as const)('%s avec un id mal formé', async (method) => {
      const res = await request(app)[method]('/api/missions/pas-un-id').set(asA()).send({ urgent: true })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('GET avec un statut inconnu', async () => {
      const res = await request(app).get('/api/missions?status=archived').set(asA())
      expect(res.status).toBe(400)
    })
  })

  describe('Cloisonnement : B ne voit pas les missions de A', () => {
    test('B ne la voit pas dans sa liste', async () => {
      await createMissionAsA()
      const res = await request(app).get('/api/missions').set(asB())
      expect(res.body).toEqual({ items: [] })
    })

    test('B ne peut ni lire, ni modifier, ni masquer (404)', async () => {
      const mission = await createMissionAsA()

      const read = await request(app).get(`/api/missions/${mission.id}`).set(asB())
      const update = await request(app)
        .patch(`/api/missions/${mission.id}`)
        .set(asB())
        .send({ title: 'Piratée par B' })
      const hide = await request(app)
        .patch(`/api/missions/${mission.id}`)
        .set(asB())
        .send({ hidden: true })

      for (const res of [read, update, hide]) {
        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe('NOT_FOUND')
      }
      const stored = await Mission.findById(mission.id)
      expect(stored?.title).toBe('Tondre la pelouse')
    })

    test('une mission absente donne la même réponse', async () => {
      const res = await request(app).get('/api/missions/6650f0c2a1b2c3d4e5f60789').set(asA())
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('Règles métier', () => {
    test('une mission qui n’est plus open ne peut pas être modifiée (409)', async () => {
      const mission = await createMissionAsA()
      await Mission.updateOne({ _id: mission.id }, { status: 'assigned' })

      const res = await request(app)
        .patch(`/api/missions/${mission.id}`)
        .set(asA())
        .send({ urgent: true })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CONFLICT')
    })

    test('une mission masquée disparaît du catalogue, puis revient une fois réaffichée', async () => {
      const mission = await createMissionAsA()
      const catalogueOfB = async () =>
        (await request(app).get('/api/explore/missions').set(asB())).body.items.map((m: { id: string }) => m.id)

      expect(await catalogueOfB()).toEqual([mission.id])

      await request(app).patch(`/api/missions/${mission.id}`).set(asA()).send({ hidden: true })
      expect(await catalogueOfB()).toEqual([])
      const detail = await request(app).get(`/api/explore/missions/${mission.id}`).set(asB())
      expect(detail.status).toBe(404)

      await request(app).patch(`/api/missions/${mission.id}`).set(asA()).send({ hidden: false })
      expect(await catalogueOfB()).toEqual([mission.id])
    })

    test('hidden non booléen → 400', async () => {
      const mission = await createMissionAsA()
      const res = await request(app).patch(`/api/missions/${mission.id}`).set(asA()).send({ hidden: 'oui' })
      expect(res.status).toBe(400)
    })
  })

  describe('Suppression : réservée aux administrateurs', () => {
    let tokenAdmin: string
    const asAdmin = () => ({ Authorization: `Bearer ${tokenAdmin}` })

    beforeEach(async () => {
      const admin = await registerUser('admin@helpup.test')
      await User.updateOne({ _id: admin.id }, { role: 'admin' })
      tokenAdmin = admin.token
    })

    test('le propriétaire ne peut pas supprimer sa mission (403)', async () => {
      const mission = await createMissionAsA()
      const res = await request(app).delete(`/api/missions/${mission.id}`).set(asA())
      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
      expect(await Mission.exists({ _id: mission.id })).not.toBeNull()
    })

    test('un administrateur supprime la mission d’un membre et ses candidatures (204)', async () => {
      const mission = await createMissionAsA()
      const { id: idC } = await registerUser('c@helpup.test')
      await Application.create({ missionId: mission.id, applicantId: idC, message: 'Je suis disponible samedi.' })

      const res = await request(app).delete(`/api/missions/${mission.id}`).set(asAdmin())
      expect(res.status).toBe(204)
      expect(res.text).toBe('')
      expect(await Mission.exists({ _id: mission.id })).toBeNull()
      expect(await Application.countDocuments({ missionId: mission.id })).toBe(0)
    })

    test('un administrateur peut supprimer une mission quel que soit son statut', async () => {
      const mission = await createMissionAsA()
      await Mission.updateOne({ _id: mission.id }, { status: 'assigned' })
      const res = await request(app).delete(`/api/missions/${mission.id}`).set(asAdmin())
      expect(res.status).toBe(204)
    })

    test('id mal formé → 400, mission absente → 404', async () => {
      const malformed = await request(app).delete('/api/missions/pas-un-id').set(asAdmin())
      const missing = await request(app).delete('/api/missions/6650f0c2a1b2c3d4e5f60789').set(asAdmin())
      expect(malformed.status).toBe(400)
      expect(missing.status).toBe(404)
    })
  })
})
