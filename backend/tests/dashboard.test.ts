import request from 'supertest';
import app from '../src/app';
import { Mission } from '../src/models/mission.model';
import { connectTestDb, clearTestDb, closeTestDb } from './setup';

beforeAll(async () => {
    await connectTestDb();
});

afterEach(async () => {
    await clearTestDb();
});

afterAll(async () => {
    await closeTestDb();
});

const register = async (email: string, firstName: string) => {
    const res = await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        firstName,
        lastName: 'Testeur'
    });
    return { id: res.body.user.id as string, token: res.body.token as string };
};

const createMission = async (ownerId: string, overrides: Record<string, unknown> = {}) => {
    const mission = await Mission.create({
        ownerId,
        title: 'Monter une armoire',
        description: 'Armoire IKEA trois portes à monter dans une chambre.',
        rewardCents: 3000,
        estimatedMinutes: 120,
        category: 'bricolage',
        scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        quartier: 'villejuif-centre',
        location: { type: 'Point', coordinates: [2.364, 48.7875] },
        ...overrides
    });
    return mission.id as string;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const MESSAGE = 'Bonjour, je suis disponible et équipé.';

describe('Suivi des missions', () => {
    let owner: { id: string; token: string };
    let alice: { id: string; token: string };
    let bob: { id: string; token: string };
    let missionId: string;
    let aliceApp: string;

    beforeEach(async () => {
        owner = await register('owner@helpup.test', 'Olivia');
        alice = await register('alice@helpup.test', 'Alice');
        bob = await register('bob@helpup.test', 'Bob');
        missionId = await createMission(owner.id);
        aliceApp = (await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE })).body.id;
        await request(app).post('/api/applications').set(auth(bob.token)).send({ missionId, message: MESSAGE });
    });

    test('parcours complet : open → assigned → completed, visible dans les tableaux de bord', async () => {
        // Avant attribution : la mission est publiée avec 2 candidatures en attente
        let dash = await request(app).get('/api/dashboard').set(auth(owner.token));
        expect(dash.status).toBe(200);
        expect(dash.body.published).toHaveLength(1);
        expect(dash.body.published[0]).toMatchObject({ id: missionId, status: 'open', role: 'owner', pendingApplications: 2, totalApplications: 2 });
        expect(dash.body.stats).toMatchObject({ openMissions: 1, pendingApplications: 2 });

        // Clôturer une mission encore ouverte est refusé
        const tooEarly = await request(app).post(`/api/missions/${missionId}/complete`).set(auth(owner.token));
        expect(tooEarly.status).toBe(400);

        await request(app).post(`/api/missions/${missionId}/applications/${aliceApp}/accept`).set(auth(owner.token));

        // Alice voit la mission dans « obtenues », avec le prénom de la cliente
        const aliceDash = await request(app).get('/api/dashboard').set(auth(alice.token));
        expect(aliceDash.body.obtained).toHaveLength(1);
        expect(aliceDash.body.obtained[0]).toMatchObject({ id: missionId, role: 'provider', status: 'assigned' });
        expect(aliceDash.body.obtained[0].counterpart).toMatchObject({ id: owner.id, firstName: 'Olivia', lastName: 'T.' });

        // Le propriétaire voit le prestataire retenu
        dash = await request(app).get('/api/dashboard').set(auth(owner.token));
        expect(dash.body.published[0]).toMatchObject({ status: 'assigned', pendingApplications: 0 });
        expect(dash.body.published[0].counterpart).toMatchObject({ id: alice.id, firstName: 'Alice' });

        const done = await request(app).post(`/api/missions/${missionId}/complete`).set(auth(owner.token));
        expect(done.status).toBe(200);
        expect(done.body).toMatchObject({ id: missionId, status: 'completed' });
        expect(done.body.completedAt).toEqual(expect.any(String));

        // Une seule clôture possible
        const twice = await request(app).post(`/api/missions/${missionId}/complete`).set(auth(owner.token));
        expect(twice.status).toBe(400);

        // Historique des deux côtés, gains comptés pour la prestataire
        dash = await request(app).get('/api/dashboard').set(auth(owner.token));
        expect(dash.body.published).toHaveLength(0);
        expect(dash.body.history[0]).toMatchObject({ id: missionId, role: 'owner' });

        const aliceAfter = await request(app).get('/api/dashboard').set(auth(alice.token));
        expect(aliceAfter.body.obtained).toHaveLength(0);
        expect(aliceAfter.body.history[0]).toMatchObject({ id: missionId, role: 'provider' });
        expect(aliceAfter.body.stats).toMatchObject({ completedMissions: 1, earnedCents: 3000 });
    });

    test('seul le propriétaire clôture : prestataire ou autre membre → 404', async () => {
        await request(app).post(`/api/missions/${missionId}/applications/${aliceApp}/accept`).set(auth(owner.token));

        const byProvider = await request(app).post(`/api/missions/${missionId}/complete`).set(auth(alice.token));
        expect(byProvider.status).toBe(404);

        const byOther = await request(app).post(`/api/missions/${missionId}/complete`).set(auth(bob.token));
        expect(byOther.status).toBe(404);
    });

    test('sans JWT → 401, id mal formé → 400', async () => {
        expect((await request(app).get('/api/dashboard')).status).toBe(401);
        expect((await request(app).post(`/api/missions/${missionId}/complete`)).status).toBe(401);

        const bad = await request(app).post('/api/missions/abc/complete').set(auth(owner.token));
        expect(bad.status).toBe(400);
    });

    test('un nouveau membre a un tableau de bord vide', async () => {
        const newcomer = await register('new@helpup.test', 'Nina');
        const res = await request(app).get('/api/dashboard').set(auth(newcomer.token));
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            stats: { openMissions: 0, pendingApplications: 0, obtainedMissions: 0, completedMissions: 0, earnedCents: 0 },
            published: [],
            obtained: [],
            history: []
        });
    });
});
