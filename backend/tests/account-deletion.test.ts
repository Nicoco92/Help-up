import request from 'supertest'
import app from '../src/api/app'
import { connectTestDb, clearTestDb, closeTestDb } from './setup'
import { User } from '../src/models/user.model'
import { Mission } from '../src/models/mission.model'
import { Application } from '../src/models/application.model'
import { Notification } from '../src/models/notification.model'
import type { MissionStatus } from '../src/constants/statuses'

beforeAll(async () => {
  await connectTestDb()
})

afterEach(async () => {
  await clearTestDb()
})

afterAll(async () => {
  await closeTestDb()
})

async function registerUser(email: string): Promise<{ token: string; id: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', firstName: 'Test', lastName: 'User' })
  return { token: res.body.token, id: res.body.user.id }
}

function missionOf(ownerId: string, status: MissionStatus = 'open') {
  return Mission.create({
    ownerId,
    status,
    title: 'Promener le chien',
    description: 'Balade de 30 minutes autour du parc.',
    rewardCents: 1000,
    estimatedMinutes: 30,
    category: 'animaux',
    scheduledAt: new Date(Date.now() + 86400000),
    quartier: 'ivry-centre',
    location: { type: 'Point', coordinates: [2.387, 48.813] },
  })
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

describe('DELETE /api/users/me', () => {
  test('sans JWT renvoie 401', async () => {
    const res = await request(app).delete('/api/users/me')
    expect(res.status).toBe(401)
  })

  test('supprime le compte, ses missions ouvertes et retire ses candidatures', async () => {
    const alice = await registerUser('alice@helpup.test')
    const bob = await registerUser('bob@helpup.test')

    const aliceOpen = await missionOf(alice.id)
    const aliceDone = await missionOf(alice.id, 'completed')
    await Application.create({ missionId: aliceOpen.id, applicantId: bob.id, message: 'Disponible ce week-end.' })
    const bobMission = await missionOf(bob.id)
    const aliceApplication = await Application.create({
      missionId: bobMission.id,
      applicantId: alice.id,
      message: 'Je peux le faire demain.',
    })
    // Une notification d'Alice, et une de Bob qui pointe vers la mission ouverte d'Alice
    await Notification.create({ userId: alice.id, type: 'application_accepted', message: 'Acceptée', link: '/dashboard' })
    await Notification.create({
      userId: bob.id,
      type: 'mission_nearby',
      message: 'Nouvelle mission',
      link: `/missions/${aliceOpen.id}`,
      missionId: aliceOpen.id,
    })
    const bobOther = await Notification.create({ userId: bob.id, type: 'review_received', message: 'Avis', link: '/dashboard' })

    const res = await request(app).delete('/api/users/me').set(auth(alice.token))
    expect(res.status).toBe(204)
    expect(res.text).toBe('')

    expect(await User.exists({ _id: alice.id })).toBeNull()
    expect(await Mission.exists({ _id: aliceOpen.id })).toBeNull()
    expect(await Application.countDocuments({ missionId: aliceOpen.id })).toBe(0)
    // L'historique de l'autre participant est conservé
    expect(await Mission.exists({ _id: aliceDone.id })).not.toBeNull()
    expect((await Application.findById(aliceApplication.id))?.status).toBe('withdrawn')
    // Ses notifications et celles qui pointent vers ses missions supprimées disparaissent, pas les autres
    expect(await Notification.countDocuments({ userId: alice.id })).toBe(0)
    expect(await Notification.countDocuments({ missionId: aliceOpen.id })).toBe(0)
    expect(await Notification.exists({ _id: bobOther.id })).not.toBeNull()

    // Le jeton ne sert plus à rien : l'utilisateur n'existe plus
    const after = await request(app).get('/api/users/me').set(auth(alice.token))
    expect(after.status).toBe(401)
  })

  test.each(['owner', 'provider'] as const)(
    'refuse (409) si une mission est en cours (%s)',
    async (role) => {
      const alice = await registerUser('alice@helpup.test')
      const bob = await registerUser('bob@helpup.test')
      const mission = await missionOf(role === 'owner' ? alice.id : bob.id, 'assigned')
      if (role === 'provider') await Mission.updateOne({ _id: mission.id }, { providerId: alice.id })

      const res = await request(app).delete('/api/users/me').set(auth(alice.token))
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CONFLICT')
      expect(await User.exists({ _id: alice.id })).not.toBeNull()
    },
  )
})

describe('DELETE /api/users/:id (administrateur)', () => {
  let admin: { token: string; id: string }
  let member: { token: string; id: string }

  beforeEach(async () => {
    admin = await registerUser('admin@helpup.test')
    await User.updateOne({ _id: admin.id }, { role: 'admin' })
    member = await registerUser('member@helpup.test')
  })

  test('un administrateur supprime un compte (204)', async () => {
    const res = await request(app).delete(`/api/users/${member.id}`).set(auth(admin.token))
    expect(res.status).toBe(204)
    expect(await User.exists({ _id: member.id })).toBeNull()
  })

  test('un membre non administrateur reçoit 403', async () => {
    const res = await request(app).delete(`/api/users/${admin.id}`).set(auth(member.token))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  test('id mal formé → 400, compte absent → 404, son propre compte → 400', async () => {
    const malformed = await request(app).delete('/api/users/abc').set(auth(admin.token))
    const missing = await request(app).delete('/api/users/6650f0c2a1b2c3d4e5f60789').set(auth(admin.token))
    const self = await request(app).delete(`/api/users/${admin.id}`).set(auth(admin.token))

    expect(malformed.status).toBe(400)
    expect(missing.status).toBe(404)
    expect(self.status).toBe(400)
  })
})
