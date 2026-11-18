import request from 'supertest';
import app from '../src/api/app';
import { Mission } from '../src/models/mission.model';
import { Message } from '../src/models/message.model';
import { Notification } from '../src/models/notification.model';
import { User } from '../src/models/user.model';
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

const createMission = async (ownerId: string) => {
    const mission = await Mission.create({
        ownerId,
        title: 'Monter une étagère',
        description: 'Étagère murale à fixer, perceuse fournie.',
        rewardCents: 2000,
        estimatedMinutes: 60,
        category: 'bricolage',
        scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        quartier: 'villejuif-centre',
        location: { type: 'Point', coordinates: [2.364, 48.7875] }
    });
    return mission.id as string;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Parcours réel : le prestataire postule, le client accepte → la conversation s'ouvre
const assign = async (owner: Account, provider: Account, missionId: string) => {
    const applied = await request(app)
        .post('/api/applications')
        .set(auth(provider.token))
        .send({ missionId, message: 'Bonjour, je suis disponible et équipé.' });
    expect(applied.status).toBe(201);
    const accepted = await request(app)
        .post(`/api/missions/${missionId}/applications/${applied.body.id}/accept`)
        .set(auth(owner.token));
    expect(accepted.status).toBe(200);
};

const send = (account: Account, missionId: string, body: unknown) =>
    request(app).post(`/api/conversations/${missionId}/messages`).set(auth(account.token)).send(body as object);

const unread = async (account: Account) =>
    (await request(app).get('/api/conversations/unread-count').set(auth(account.token))).body.count as number;

describe('Messagerie privée', () => {
    let alice: Account; // cliente, publie la mission
    let bob: Account; // prestataire retenu
    let chloe: Account; // candidate refusée
    let dan: Account; // membre sans lien avec la mission
    let missionId: string;

    beforeEach(async () => {
        alice = await register('alice@helpup.test', 'Alice');
        bob = await register('bob@helpup.test', 'Bob');
        chloe = await register('chloe@helpup.test', 'Chloé');
        dan = await register('dan@helpup.test', 'Dan');
        missionId = await createMission(alice.id);
    });

    test('parcours nominal : après acceptation, client et prestataire échangent', async () => {
        await assign(alice, bob, missionId);

        // La conversation apparaît des deux côtés, encore vide
        const list = await request(app).get('/api/conversations').set(auth(alice.token));
        expect(list.status).toBe(200);
        expect(list.body.items).toHaveLength(1);
        expect(list.body.items[0]).toMatchObject({
            id: missionId,
            role: 'owner',
            canWrite: true,
            lastMessage: null,
            unreadCount: 0,
            counterpart: { id: bob.id, firstName: 'Bob', lastName: 'T.' }
        });
        expect(list.body.items[0].counterpart).not.toHaveProperty('email');

        // Alice écrit
        const sent = await send(alice, missionId, { body: '  Bonjour Bob, à quelle heure passez-vous ?  ' });
        expect(sent.status).toBe(201);
        expect(sent.body).toMatchObject({
            missionId,
            senderId: alice.id,
            recipientId: bob.id,
            body: 'Bonjour Bob, à quelle heure passez-vous ?',
            mine: true,
            read: false
        });
        expect(sent.body).toHaveProperty('id');
        expect(sent.body).not.toHaveProperty('_id');

        // Bob a un message non lu et une notification qui ouvre la conversation
        expect(await unread(bob)).toBe(1);
        const bobConversations = await request(app).get('/api/conversations').set(auth(bob.token));
        expect(bobConversations.body.items[0]).toMatchObject({ role: 'provider', unreadCount: 1 });
        expect(bobConversations.body.items[0].lastMessage).toMatchObject({ mine: false });
        const notification = await Notification.findOne({ userId: bob.id, type: 'message_received' }).lean();
        expect(notification).toMatchObject({ link: `/messages/${missionId}` });
        expect(notification?.message).toContain('Alice T.');

        // Bob ouvre le fil : le message passe « lu »
        const thread = await request(app).get(`/api/conversations/${missionId}/messages`).set(auth(bob.token));
        expect(thread.status).toBe(200);
        expect(thread.body.items).toHaveLength(1);
        expect(thread.body.items[0]).toMatchObject({ mine: false, read: true });
        expect(await unread(bob)).toBe(0);

        // Bob répond ; Alice ne récupère que les nouveaux messages avec ?after=
        const reply = await send(bob, missionId, { body: 'Vers 14 h, ça vous va ?' });
        expect(reply.status).toBe(201);
        const newer = await request(app)
            .get(`/api/conversations/${missionId}/messages?after=${sent.body.id}`)
            .set(auth(alice.token));
        expect(newer.body.items.map((m: { body: string }) => m.body)).toEqual(['Vers 14 h, ça vous va ?']);

        const header = await request(app).get(`/api/conversations/${missionId}`).set(auth(alice.token));
        expect(header.status).toBe(200);
        expect(header.body).toMatchObject({ id: missionId, canWrite: true, mission: { id: missionId, status: 'assigned' } });
    });

    test('une seule notification tant que le destinataire n’a pas lu', async () => {
        await assign(alice, bob, missionId);
        await send(alice, missionId, { body: 'Premier message' });
        await send(alice, missionId, { body: 'Deuxième message' });
        expect(await Notification.countDocuments({ userId: bob.id, type: 'message_received' })).toBe(1);
        expect(await unread(bob)).toBe(2);

        // Bob lit, Alice écrit de nouveau : nouvelle notification
        await request(app).get(`/api/conversations/${missionId}/messages`).set(auth(bob.token));
        await send(alice, missionId, { body: 'Troisième message' });
        expect(await Notification.countDocuments({ userId: bob.id, type: 'message_received' })).toBe(2);
    });

    test('données invalides → 400', async () => {
        await assign(alice, bob, missionId);
        for (const body of [{}, { body: '' }, { body: '    ' }, { body: 'x'.repeat(2001) }, { body: 42 }]) {
            const res = await send(alice, missionId, body);
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INVALID_INPUT');
        }
        // Champs fixés par le serveur ou inconnus
        for (const extra of [{ senderId: bob.id }, { recipientId: alice.id }, { id: missionId }, { missionId }, { urgent: true }]) {
            expect((await send(alice, missionId, { body: 'Bonjour', ...extra })).status).toBe(400);
        }
        // Identifiants mal formés
        expect((await send(alice, 'pas-un-id', { body: 'Bonjour' })).status).toBe(400);
        expect((await request(app).get('/api/conversations/pas-un-id').set(auth(alice.token))).status).toBe(400);
        const badAfter = await request(app).get(`/api/conversations/${missionId}/messages?after=123`).set(auth(alice.token));
        expect(badAfter.status).toBe(400);
        const unknownQuery = await request(app).get(`/api/conversations/${missionId}/messages?foo=1`).set(auth(alice.token));
        expect(unknownQuery.status).toBe(400);
        expect(await Message.countDocuments()).toBe(0);
    });

    test('sans JWT → 401', async () => {
        await assign(alice, bob, missionId);
        expect((await request(app).get('/api/conversations')).status).toBe(401);
        expect((await request(app).get('/api/conversations/unread-count')).status).toBe(401);
        expect((await request(app).get(`/api/conversations/${missionId}`)).status).toBe(401);
        expect((await request(app).get(`/api/conversations/${missionId}/messages`)).status).toBe(401);
        const res = await request(app).post(`/api/conversations/${missionId}/messages`).send({ body: 'Bonjour' });
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('un tiers ou un candidat refusé ne voit ni n’écrit dans la conversation (404)', async () => {
        // Chloé postule aussi, puis est refusée automatiquement quand Alice accepte Bob
        const applied = await request(app)
            .post('/api/applications')
            .set(auth(chloe.token))
            .send({ missionId, message: 'Bonjour, moi aussi je suis disponible.' });
        expect(applied.status).toBe(201);
        await assign(alice, bob, missionId);
        await send(alice, missionId, { body: 'Message privé pour Bob' });

        for (const outsider of [chloe, dan]) {
            expect((await request(app).get(`/api/conversations/${missionId}`).set(auth(outsider.token))).status).toBe(404);
            const thread = await request(app).get(`/api/conversations/${missionId}/messages`).set(auth(outsider.token));
            expect(thread.status).toBe(404);
            expect(thread.body.error.code).toBe('NOT_FOUND');
            expect((await send(outsider, missionId, { body: 'Coucou' })).status).toBe(404);
            expect((await request(app).get('/api/conversations').set(auth(outsider.token))).body.items).toEqual([]);
            expect(await unread(outsider)).toBe(0);
        }
        // La lecture par un tiers n'a pas marqué le message comme lu
        expect(await unread(bob)).toBe(1);
    });

    test('pas de conversation tant qu’aucune candidature n’est acceptée (404)', async () => {
        await request(app)
            .post('/api/applications')
            .set(auth(bob.token))
            .send({ missionId, message: 'Bonjour, je suis disponible et équipé.' });
        expect((await send(bob, missionId, { body: 'Bonjour' })).status).toBe(404);
        expect((await send(alice, missionId, { body: 'Bonjour' })).status).toBe(404);
        expect((await request(app).get('/api/conversations').set(auth(alice.token))).body.items).toEqual([]);
    });

    test('mission terminée : la conversation reste lisible mais n’accepte plus de messages (409)', async () => {
        await assign(alice, bob, missionId);
        await send(bob, missionId, { body: 'C’est fait, bonne soirée !' });
        expect((await request(app).post(`/api/missions/${missionId}/complete`).set(auth(alice.token))).status).toBe(200);

        const res = await send(alice, missionId, { body: 'Merci !' });
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');

        const header = await request(app).get(`/api/conversations/${missionId}`).set(auth(alice.token));
        expect(header.body).toMatchObject({ canWrite: false, mission: { status: 'completed' } });
        const thread = await request(app).get(`/api/conversations/${missionId}/messages`).set(auth(alice.token));
        expect(thread.body.items).toHaveLength(1);
    });

    test('les conversations sont triées par activité récente', async () => {
        const other = await createMission(alice.id);
        await assign(alice, bob, missionId);
        await assign(alice, chloe, other);
        await send(alice, missionId, { body: 'Pour Bob' });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await send(alice, other, { body: 'Pour Chloé' });

        const list = await request(app).get('/api/conversations').set(auth(alice.token));
        expect(list.body.items.map((c: { id: string }) => c.id)).toEqual([other, missionId]);
    });

    test('supprimer son compte supprime ses messages', async () => {
        await assign(alice, bob, missionId);
        await send(alice, missionId, { body: 'Bonjour Bob' });
        await request(app).post(`/api/missions/${missionId}/complete`).set(auth(alice.token));

        // Compte de Bob supprimé (mission terminée : autorisé) → ses messages disparaissent
        expect((await request(app).delete('/api/users/me').set(auth(bob.token))).status).toBe(204);
        expect(await Message.countDocuments()).toBe(0);
    });

    test('une mission supprimée par un administrateur emporte ses messages', async () => {
        await assign(alice, bob, missionId);
        await send(alice, missionId, { body: 'Bonjour Bob' });
        await User.updateOne({ _id: dan.id }, { role: 'admin' });

        expect((await request(app).delete(`/api/missions/${missionId}`).set(auth(dan.token))).status).toBe(204);
        expect(await Message.countDocuments()).toBe(0);
    });
});
