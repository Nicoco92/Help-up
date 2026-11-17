import request from 'supertest';
import app from '../src/api/app';
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

type Account = { id: string; token: string };

const register = async (email: string, firstName: string): Promise<Account> => {
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
        title: 'Tondre la pelouse',
        description: 'Petit jardin de 50 m², tondeuse fournie.',
        rewardCents: 2500,
        estimatedMinutes: 60,
        category: 'jardinage',
        scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        quartier: 'villejuif-centre',
        location: { type: 'Point', coordinates: [2.364, 48.7875] },
        ...overrides
    });
    return mission.id as string;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Avis entre membres', () => {
    let owner: Account;
    let provider: Account;
    let outsider: Account;
    let missionId: string;

    beforeEach(async () => {
        owner = await register('owner@helpup.test', 'Olivia');
        provider = await register('provider@helpup.test', 'Paul');
        outsider = await register('outsider@helpup.test', 'Oscar');
        missionId = await createMission(owner.id, { status: 'completed', providerId: provider.id, completedAt: new Date() });
    });

    test('parcours CRUD : créer, lister, lire, modifier, supprimer', async () => {
        const created = await request(app).post('/api/reviews').set(auth(owner.token))
            .send({ missionId, rating: 5, comment: '  Très soigneux, merci !  ' });
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({
            missionId,
            authorId: owner.id,
            targetId: provider.id,
            rating: 5,
            comment: 'Très soigneux, merci !'
        });
        expect(created.body.id).toEqual(expect.any(String));
        expect(created.body._id).toBeUndefined();
        expect(created.body.target).toMatchObject({ id: provider.id, firstName: 'Paul', lastName: 'T.' });
        expect(created.body.mission).toMatchObject({ id: missionId, title: 'Tondre la pelouse' });
        const reviewId = created.body.id as string;

        const list = await request(app).get('/api/reviews').set(auth(owner.token));
        expect(list.status).toBe(200);
        expect(list.body.items).toHaveLength(1);

        const one = await request(app).get(`/api/reviews/${reviewId}`).set(auth(owner.token));
        expect(one.status).toBe(200);
        expect(one.body.rating).toBe(5);

        const patched = await request(app).patch(`/api/reviews/${reviewId}`).set(auth(owner.token)).send({ rating: 4 });
        expect(patched.status).toBe(200);
        expect(patched.body).toMatchObject({ rating: 4, comment: 'Très soigneux, merci !' });

        const removed = await request(app).delete(`/api/reviews/${reviewId}`).set(auth(owner.token));
        expect(removed.status).toBe(204);
        expect(removed.text).toBe('');

        const empty = await request(app).get('/api/reviews').set(auth(owner.token));
        expect(empty.body).toEqual({ items: [] });
    });

    test('le prestataire note le client ; profil public avec note moyenne', async () => {
        await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 5 });
        await request(app).post('/api/reviews').set(auth(provider.token)).send({ missionId, rating: 4, comment: 'Accueil sympa' });

        // Une deuxième mission terminée, notée 4 : moyenne de Paul = 4,5
        const second = await createMission(owner.id, { status: 'completed', providerId: provider.id });
        await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId: second, rating: 4 });

        const paul = await request(app).get(`/api/users/${provider.id}/reviews`).set(auth(outsider.token));
        expect(paul.status).toBe(200);
        expect(paul.body.summary).toEqual({ average: 4.5, count: 2 });
        expect(paul.body.items).toHaveLength(2);
        expect(paul.body.items[0].author).toMatchObject({ id: owner.id, firstName: 'Olivia' });
        expect(paul.body.items[0].author.email).toBeUndefined();

        const olivia = await request(app).get(`/api/users/${owner.id}/reviews`).set(auth(outsider.token));
        expect(olivia.body.summary).toEqual({ average: 4, count: 1 });
        expect(olivia.body.items[0]).toMatchObject({ authorId: provider.id, comment: 'Accueil sympa' });

        const nobody = await request(app).get(`/api/users/${outsider.id}/reviews`).set(auth(owner.token));
        expect(nobody.body).toEqual({ items: [], summary: { average: null, count: 0 } });
    });

    test('règles métier : mission non terminée → 400, doublon → 409, mission d’un autre → 404', async () => {
        const open = await createMission(owner.id);
        const notDone = await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId: open, rating: 3 });
        expect(notDone.status).toBe(400);

        await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 5 });
        const twice = await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 1 });
        expect(twice.status).toBe(409);
        expect(twice.body.error.code).toBe('CONFLICT');

        // Oscar n'a pas participé à la mission : il ne peut pas la noter
        const stranger = await request(app).post('/api/reviews').set(auth(outsider.token)).send({ missionId, rating: 1 });
        expect(stranger.status).toBe(404);

        const ghost = await request(app).post('/api/reviews').set(auth(owner.token))
            .send({ missionId: '0123456789abcdef01234567', rating: 4 });
        expect(ghost.status).toBe(404);
    });

    test('données invalides → 400 (note hors bornes, champ serveur, PATCH vide)', async () => {
        const cases = [
            { missionId, rating: 0 },
            { missionId, rating: 6 },
            { missionId, rating: 3.5 },
            { missionId, rating: '5' },
            { missionId },
            { missionId, rating: 4, targetId: owner.id },
            { missionId, rating: 4, authorId: provider.id },
            { missionId, rating: 4, id: missionId },
            { missionId, rating: 4, comment: 'x'.repeat(501) },
            { missionId: 'abc', rating: 4 }
        ];
        for (const body of cases) {
            const res = await request(app).post('/api/reviews').set(auth(owner.token)).send(body);
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INVALID_INPUT');
        }

        const created = await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 5 });
        const emptyPatch = await request(app).patch(`/api/reviews/${created.body.id}`).set(auth(owner.token)).send({});
        expect(emptyPatch.status).toBe(400);

        const badId = await request(app).get('/api/reviews/abc').set(auth(owner.token));
        expect(badId.status).toBe(400);
        const badUser = await request(app).get('/api/users/abc/reviews').set(auth(owner.token));
        expect(badUser.status).toBe(400);
    });

    test('sans JWT → 401', async () => {
        expect((await request(app).get('/api/reviews')).status).toBe(401);
        expect((await request(app).post('/api/reviews').send({ missionId, rating: 5 })).status).toBe(401);
        expect((await request(app).get(`/api/users/${owner.id}/reviews`)).status).toBe(401);
    });

    test('B ne peut ni lire, ni modifier, ni supprimer l’avis de A → 404', async () => {
        const created = await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 5 });
        const reviewId = created.body.id as string;

        // Même la personne notée ne peut pas modifier l'avis qu'elle a reçu
        for (const other of [provider, outsider]) {
            expect((await request(app).get(`/api/reviews/${reviewId}`).set(auth(other.token))).status).toBe(404);
            expect((await request(app).patch(`/api/reviews/${reviewId}`).set(auth(other.token)).send({ rating: 1 })).status).toBe(404);
            expect((await request(app).delete(`/api/reviews/${reviewId}`).set(auth(other.token))).status).toBe(404);
        }

        const stillThere = await request(app).get(`/api/reviews/${reviewId}`).set(auth(owner.token));
        expect(stillThere.body.rating).toBe(5);
    });

    test('le tableau de bord indique les missions déjà notées', async () => {
        let dash = await request(app).get('/api/dashboard').set(auth(owner.token));
        expect(dash.body.history[0]).toMatchObject({ id: missionId, myReview: null });

        await request(app).post('/api/reviews').set(auth(owner.token)).send({ missionId, rating: 4, comment: 'Bien' });
        dash = await request(app).get('/api/dashboard').set(auth(owner.token));
        expect(dash.body.history[0].myReview).toMatchObject({ rating: 4, comment: 'Bien' });

        // Le prestataire n'a pas encore noté
        const providerDash = await request(app).get('/api/dashboard').set(auth(provider.token));
        expect(providerDash.body.history[0].myReview).toBeNull();
    });
});
