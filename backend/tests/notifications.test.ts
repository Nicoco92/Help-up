import request from 'supertest';
import app from '../src/app';
import { Mission } from '../src/models/mission.model';
import { Notification } from '../src/models/notification.model';
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

const register = async (email: string, firstName: string, extra: Record<string, unknown> = {}): Promise<Account> => {
    const res = await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        firstName,
        lastName: 'Testeur',
        ...extra
    });
    return { id: res.body.user.id as string, token: res.body.token as string };
};

const createMission = async (ownerId: string, overrides: Record<string, unknown> = {}) => {
    const mission = await Mission.create({
        ownerId,
        title: 'Monter une étagère',
        description: 'Étagère murale à fixer, perceuse fournie.',
        rewardCents: 2000,
        estimatedMinutes: 60,
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

const notificationsOf = async (account: Account) =>
    (await request(app).get('/api/notifications').set(auth(account.token))).body as {
        items: { id: string; type: string; message: string; link: string; read: boolean }[];
        unreadCount: number;
    };

// La notification de voisinage part en arrière-plan après la création : on attend qu'elle arrive
const waitForNotifications = async (userId: string, count: number) => {
    for (let i = 0; i < 50; i += 1) {
        if ((await Notification.countDocuments({ userId })) >= count) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
    }
};

describe('Notifications', () => {
    let owner: Account;
    let bob: Account;
    let chloe: Account;

    beforeEach(async () => {
        owner = await register('owner@helpup.test', 'Olivia', { city: 'Villejuif' });
        bob = await register('bob@helpup.test', 'Bob', { city: 'villejuif', skills: ['bricolage'] });
        chloe = await register('chloe@helpup.test', 'Chloé', { city: 'Ivry-sur-Seine', skills: ['bricolage'] });
    });

    test('une nouvelle mission prévient les voisins qui ont la compétence', async () => {
        const missionId = await createMission(owner.id);
        await waitForNotifications(bob.id, 1);

        const bobs = await notificationsOf(bob);
        expect(bobs.unreadCount).toBe(1);
        expect(bobs.items[0]).toMatchObject({ type: 'mission_nearby', link: `/missions/${missionId}`, read: false });
        expect(bobs.items[0].message).toContain('Monter une étagère');
        expect(bobs.items[0].message).toContain('Villejuif · Centre');

        // Chloé habite Ivry, la propriétaire ne se prévient pas elle-même
        expect((await notificationsOf(chloe)).items).toHaveLength(0);
        expect((await notificationsOf(owner)).items).toHaveLength(0);

        // Une autre catégorie ne prévient pas Bob
        await createMission(owner.id, { category: 'animaux', title: 'Garder un chat' });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect((await notificationsOf(bob)).items).toHaveLength(1);
    });

    test('parcours complet : candidature, acceptation, refus, clôture, avis', async () => {
        const missionId = await createMission(owner.id, { category: 'courses' });
        const bobApp = await request(app).post('/api/applications').set(auth(bob.token)).send({ missionId, message: MESSAGE });
        await request(app).post('/api/applications').set(auth(chloe.token)).send({ missionId, message: MESSAGE });

        let olivia = await notificationsOf(owner);
        expect(olivia.items.map((n) => n.type)).toEqual(['application_received', 'application_received']);
        expect(olivia.items[1].message).toBe('Bob T. a postulé à « Monter une étagère ».');

        await request(app).post(`/api/missions/${missionId}/applications/${bobApp.body.id}/accept`).set(auth(owner.token));
        expect((await notificationsOf(bob)).items[0]).toMatchObject({ type: 'application_accepted', link: '/dashboard' });
        // Chloé, refusée automatiquement, est prévenue aussi
        expect((await notificationsOf(chloe)).items[0]).toMatchObject({ type: 'application_rejected', link: '/applications' });

        await request(app).post(`/api/missions/${missionId}/complete`).set(auth(owner.token));
        const bobs = await notificationsOf(bob);
        expect(bobs.items[0].type).toBe('mission_completed');
        expect(bobs.items[0].message).toContain('Pensez à noter Olivia');

        await request(app).post('/api/reviews').set(auth(bob.token)).send({ missionId, rating: 5 });
        olivia = await notificationsOf(owner);
        expect(olivia.items[0]).toMatchObject({ type: 'review_received', link: '/profile' });
        expect(olivia.items[0].message).toContain('(5/5)');
    });

    test('refuser une candidature prévient le candidat', async () => {
        const missionId = await createMission(owner.id, { category: 'courses' });
        const chloeApp = await request(app).post('/api/applications').set(auth(chloe.token)).send({ missionId, message: MESSAGE });
        await request(app).post(`/api/missions/${missionId}/applications/${chloeApp.body.id}/reject`).set(auth(owner.token));
        expect((await notificationsOf(chloe)).items[0].type).toBe('application_rejected');
    });

    test('lire, marquer lue / non lue, tout marquer, filtrer, supprimer', async () => {
        const missionId = await createMission(owner.id, { category: 'courses' });
        await request(app).post('/api/applications').set(auth(bob.token)).send({ missionId, message: MESSAGE });
        await request(app).post('/api/applications').set(auth(chloe.token)).send({ missionId, message: MESSAGE });

        const count = await request(app).get('/api/notifications/unread-count').set(auth(owner.token));
        expect(count.body).toEqual({ count: 2 });

        const [first, second] = (await notificationsOf(owner)).items;
        expect(first.id).toEqual(expect.any(String));
        expect((first as Record<string, unknown>)._id).toBeUndefined();

        const one = await request(app).get(`/api/notifications/${first.id}`).set(auth(owner.token));
        expect(one.status).toBe(200);

        const read = await request(app).patch(`/api/notifications/${first.id}`).set(auth(owner.token)).send({ read: true });
        expect(read.status).toBe(200);
        expect(read.body.read).toBe(true);
        expect(read.body.readAt).toEqual(expect.any(String));

        const unreadOnly = await request(app).get('/api/notifications?unread=true').set(auth(owner.token));
        expect(unreadOnly.body.items.map((n: { id: string }) => n.id)).toEqual([second.id]);
        expect(unreadOnly.body.unreadCount).toBe(1);

        const unread = await request(app).patch(`/api/notifications/${first.id}`).set(auth(owner.token)).send({ read: false });
        expect(unread.body).toMatchObject({ read: false, readAt: null });

        const all = await request(app).post('/api/notifications/read-all').set(auth(owner.token));
        expect(all.body).toEqual({ updated: 2 });
        expect((await notificationsOf(owner)).unreadCount).toBe(0);

        const removed = await request(app).delete(`/api/notifications/${first.id}`).set(auth(owner.token));
        expect(removed.status).toBe(204);
        expect((await notificationsOf(owner)).items).toHaveLength(1);
    });

    test('données invalides → 400', async () => {
        const missionId = await createMission(owner.id, { category: 'courses' });
        await request(app).post('/api/applications').set(auth(bob.token)).send({ missionId, message: MESSAGE });
        const [notification] = (await notificationsOf(owner)).items;

        for (const body of [{}, { read: 'yes' }, { read: true, message: 'piraté' }, { read: true, userId: bob.id }]) {
            const res = await request(app).patch(`/api/notifications/${notification.id}`).set(auth(owner.token)).send(body);
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INVALID_INPUT');
        }
        expect((await request(app).get('/api/notifications?unread=oui').set(auth(owner.token))).status).toBe(400);
        expect((await request(app).get('/api/notifications/abc').set(auth(owner.token))).status).toBe(400);
        // Le client ne crée jamais de notification
        expect((await request(app).post('/api/notifications').set(auth(owner.token)).send({ message: 'x' })).status).toBe(404);
    });

    test('sans JWT → 401', async () => {
        expect((await request(app).get('/api/notifications')).status).toBe(401);
        expect((await request(app).get('/api/notifications/unread-count')).status).toBe(401);
        expect((await request(app).post('/api/notifications/read-all')).status).toBe(401);
    });

    test('B ne peut ni lire, ni modifier, ni supprimer les notifications de A → 404', async () => {
        const missionId = await createMission(owner.id, { category: 'courses' });
        await request(app).post('/api/applications').set(auth(bob.token)).send({ missionId, message: MESSAGE });
        const [notification] = (await notificationsOf(owner)).items;

        expect((await request(app).get(`/api/notifications/${notification.id}`).set(auth(bob.token))).status).toBe(404);
        expect((await request(app).patch(`/api/notifications/${notification.id}`).set(auth(bob.token)).send({ read: true })).status).toBe(404);
        expect((await request(app).delete(`/api/notifications/${notification.id}`).set(auth(bob.token))).status).toBe(404);

        // « Tout marquer comme lu » de Bob ne touche pas aux notifications d'Olivia
        await request(app).post('/api/notifications/read-all').set(auth(bob.token));
        expect((await notificationsOf(owner)).unreadCount).toBe(1);
    });
});
