import request from 'supertest';
import app from '../src/app';
import { Mission } from '../src/models/mission.model';
import { Application } from '../src/models/application.model';
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

// Crée un membre par l'API et renvoie son id et son jeton
const register = async (email: string, firstName: string) => {
    const res = await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        firstName,
        lastName: 'Testeur'
    });
    return { id: res.body.user.id as string, token: res.body.token as string };
};

// Les missions sont créées directement en base (le CRUD /api/missions est la feature de Nicolas)
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

const MESSAGE = 'Bonjour, je suis disponible et équipé.';

describe('/api/applications', () => {
    let owner: { id: string; token: string };
    let alice: { id: string; token: string };
    let bob: { id: string; token: string };
    let missionId: string;

    beforeEach(async () => {
        owner = await register('owner@helpup.test', 'Olivia');
        alice = await register('alice@helpup.test', 'Alice');
        bob = await register('bob@helpup.test', 'Bob');
        missionId = await createMission(owner.id);
    });

    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    test('parcours CRUD nominal : postuler, lister, lire, modifier, retirer', async () => {
        const created = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE });
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({ missionId, applicantId: alice.id, message: MESSAGE, status: 'pending' });
        expect(created.body.id).toEqual(expect.any(String));
        expect(created.body._id).toBeUndefined();
        expect(created.body.mission).toMatchObject({ id: missionId, title: 'Monter une armoire', status: 'open' });

        const list = await request(app).get('/api/applications').set(auth(alice.token));
        expect(list.status).toBe(200);
        expect(list.body.items).toHaveLength(1);

        const id = created.body.id;
        const read = await request(app).get(`/api/applications/${id}`).set(auth(alice.token));
        expect(read.status).toBe(200);
        expect(read.body.id).toBe(id);

        const patched = await request(app).patch(`/api/applications/${id}`).set(auth(alice.token))
            .send({ message: 'Message modifié, toujours disponible.' });
        expect(patched.status).toBe(200);
        expect(patched.body.message).toBe('Message modifié, toujours disponible.');

        const removed = await request(app).delete(`/api/applications/${id}`).set(auth(alice.token));
        expect(removed.status).toBe(204);
        expect(removed.text).toBe('');

        const gone = await request(app).get(`/api/applications/${id}`).set(auth(alice.token));
        expect(gone.status).toBe(404);

        const empty = await request(app).get('/api/applications').set(auth(alice.token));
        expect(empty.body).toEqual({ items: [] });
    });

    test('sans JWT → 401', async () => {
        const res = await request(app).get('/api/applications');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');

        const post = await request(app).post('/api/applications').send({ missionId, message: MESSAGE });
        expect(post.status).toBe(401);

        const candidates = await request(app).get(`/api/missions/${missionId}/applications`);
        expect(candidates.status).toBe(401);
    });

    test('données invalides → 400 INVALID_INPUT', async () => {
        const tooShort = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: 'court' });
        expect(tooShort.status).toBe(400);
        expect(tooShort.body.error.code).toBe('INVALID_INPUT');

        // applicantId et status sont fixés par le serveur
        const forbidden = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE, applicantId: bob.id });
        expect(forbidden.status).toBe(400);

        const badMission = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId: 'abc', message: MESSAGE });
        expect(badMission.status).toBe(400);

        const badId = await request(app).get('/api/applications/abc').set(auth(alice.token));
        expect(badId.status).toBe(400);

        const created = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE });
        const emptyPatch = await request(app).patch(`/api/applications/${created.body.id}`).set(auth(alice.token))
            .send({});
        expect(emptyPatch.status).toBe(400);
    });

    test('B ne peut ni lire, ni modifier, ni retirer la candidature de A → 404', async () => {
        const created = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE });
        const id = created.body.id;

        const read = await request(app).get(`/api/applications/${id}`).set(auth(bob.token));
        expect(read.status).toBe(404);

        const patch = await request(app).patch(`/api/applications/${id}`).set(auth(bob.token))
            .send({ message: 'Je modifie la candidature d’Alice.' });
        expect(patch.status).toBe(404);

        const del = await request(app).delete(`/api/applications/${id}`).set(auth(bob.token));
        expect(del.status).toBe(404);

        const list = await request(app).get('/api/applications').set(auth(bob.token));
        expect(list.body.items).toHaveLength(0);
    });

    test('règles métier : sa propre mission, mission fermée, absente, doublon', async () => {
        const own = await request(app).post('/api/applications').set(auth(owner.token))
            .send({ missionId, message: MESSAGE });
        expect(own.status).toBe(400);

        const closedId = await createMission(owner.id, { status: 'assigned', providerId: bob.id });
        const closed = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId: closedId, message: MESSAGE });
        expect(closed.status).toBe(400);

        const missing = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId: '64b000000000000000000099', message: MESSAGE });
        expect(missing.status).toBe(404);

        await request(app).post('/api/applications').set(auth(alice.token)).send({ missionId, message: MESSAGE });
        const twice = await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE });
        expect(twice.status).toBe(409);
        expect(twice.body.error.code).toBe('CONFLICT');
    });
});

describe('/api/missions/:id/applications', () => {
    let owner: { id: string; token: string };
    let alice: { id: string; token: string };
    let bob: { id: string; token: string };
    let missionId: string;
    let aliceApp: string;
    let bobApp: string;

    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    beforeEach(async () => {
        owner = await register('owner@helpup.test', 'Olivia');
        alice = await register('alice@helpup.test', 'Alice');
        bob = await register('bob@helpup.test', 'Bob');
        missionId = await createMission(owner.id);
        aliceApp = (await request(app).post('/api/applications').set(auth(alice.token))
            .send({ missionId, message: MESSAGE })).body.id;
        bobApp = (await request(app).post('/api/applications').set(auth(bob.token))
            .send({ missionId, message: MESSAGE })).body.id;
    });

    test('le propriétaire voit les candidats, avec un profil public seulement', async () => {
        const res = await request(app).get(`/api/missions/${missionId}/applications`).set(auth(owner.token));
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0].applicant).toMatchObject({ id: alice.id, firstName: 'Alice', lastName: 'T.' });
        expect(JSON.stringify(res.body)).not.toContain('@helpup.test');
    });

    test('un autre membre ne voit pas les candidats → 404', async () => {
        const res = await request(app).get(`/api/missions/${missionId}/applications`).set(auth(alice.token));
        expect(res.status).toBe(404);

        const accept = await request(app)
            .post(`/api/missions/${missionId}/applications/${bobApp}/accept`).set(auth(alice.token));
        expect(accept.status).toBe(404);
    });

    test('accepter : mission attribuée, autres candidatures refusées', async () => {
        const res = await request(app)
            .post(`/api/missions/${missionId}/applications/${aliceApp}/accept`).set(auth(owner.token));
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('accepted');
        expect(res.body.mission).toMatchObject({ status: 'assigned', providerId: alice.id });

        const mission = await Mission.findById(missionId).lean();
        expect(mission?.status).toBe('assigned');
        expect(String(mission?.providerId)).toBe(alice.id);
        expect((await Application.findById(bobApp).lean())?.status).toBe('rejected');

        // La mission n'est plus ouverte : on ne peut plus accepter, ni postuler, ni retirer
        const again = await request(app)
            .post(`/api/missions/${missionId}/applications/${bobApp}/accept`).set(auth(owner.token));
        expect(again.status).toBe(400);

        const withdraw = await request(app).delete(`/api/applications/${aliceApp}`).set(auth(alice.token));
        expect(withdraw.status).toBe(400);
    });

    test('refuser : la candidature est refusée, la mission reste ouverte', async () => {
        const res = await request(app)
            .post(`/api/missions/${missionId}/applications/${bobApp}/reject`).set(auth(owner.token));
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('rejected');
        expect((await Mission.findById(missionId).lean())?.status).toBe('open');

        const twice = await request(app)
            .post(`/api/missions/${missionId}/applications/${bobApp}/reject`).set(auth(owner.token));
        expect(twice.status).toBe(400);
    });

    test('ids mal formés → 400, candidature d’une autre mission → 404', async () => {
        const badMission = await request(app).get('/api/missions/abc/applications').set(auth(owner.token));
        expect(badMission.status).toBe(400);

        const otherMission = await createMission(owner.id, { title: 'Promener le chien' });
        const res = await request(app)
            .post(`/api/missions/${otherMission}/applications/${aliceApp}/accept`).set(auth(owner.token));
        expect(res.status).toBe(404);
    });
});
