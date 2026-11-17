import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import app from '../src/api/app';
import { User } from '../src/models/user.model';
import { Mission } from '../src/models/mission.model';
import { connectTestDb, clearTestDb, closeTestDb } from './setup';

// Audit de sécurité (docs/securite.md) : chaque test rejoue une attaque et vérifie qu'elle échoue.
// Secret connu du test, pour fabriquer des jetons valides, falsifiés ou expirés.
const SECRET = 'audit-secret-0123456789abcdef0123456789abcdef';

beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    await connectTestDb();
});

afterEach(async () => {
    await clearTestDb();
});

afterAll(async () => {
    delete process.env.RATE_LIMIT_IN_TESTS;
    delete process.env.JWT_SECRET;
    await closeTestDb();
});

type Account = { id: string; token: string };

let counter = 0;
const register = async (overrides: Record<string, unknown> = {}): Promise<Account> => {
    counter += 1;
    const res = await request(app).post('/api/auth/register').send({
        email: `membre${counter}@helpup.test`,
        password: 'password123',
        firstName: 'Membre',
        lastName: 'Testeur',
        ...overrides
    });
    return { id: res.body.user.id as string, token: res.body.token as string };
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Jeton fabriqué à la main : mêmes réglages que l'API, sauf ce que le test veut falsifier
const forge = (sub: string, options: jwt.SignOptions = {}, secret = SECRET) =>
    jwt.sign({}, secret, { algorithm: 'HS256', subject: sub, issuer: 'helpup-api', audience: 'helpup-web', expiresIn: '1h', ...options });

describe('En-têtes HTTP (A05 : mauvaise configuration)', () => {
    test('helmet, pas de X-Powered-By, pas de cache sur les données personnelles', async () => {
        const account = await register();
        const res = await request(app).get('/api/users/me').set(auth(account.token));
        expect(res.status).toBe(200);
        expect(res.headers['x-powered-by']).toBeUndefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['content-security-policy']).toContain("default-src 'self'");
        expect(res.headers['strict-transport-security']).toBeDefined();
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['cache-control']).toBe('no-store');
    });

    test('CORS : seule l’origine du front est autorisée', async () => {
        const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
        expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

        const evil = await request(app).get('/api/health').set('Origin', 'https://pirate.example');
        expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('Jetons JWT (A07 : authentification)', () => {
    let account: Account;

    beforeEach(async () => {
        account = await register();
    });

    test('un jeton valide est accepté', async () => {
        expect((await request(app).get('/api/users/me').set(auth(forge(account.id)))).status).toBe(200);
    });

    test.each([
        ['signé avec un autre secret', () => forge(account.id, {}, 'un-autre-secret-0123456789abcdef0123')],
        ['expiré', () => forge(account.id, { expiresIn: -10 })],
        ['émis par une autre application', () => forge(account.id, { issuer: 'autre-app' })],
        ['destiné à une autre application', () => forge(account.id, { audience: 'autre-app' })],
        ['sans signature (alg: none)', () => jwt.sign({ sub: account.id, iss: 'helpup-api', aud: 'helpup-web' }, '', { algorithm: 'none' })],
        ['signé en HS512 au lieu de HS256', () => forge(account.id, { algorithm: 'HS512' })],
        ['avec un sujet qui n’est pas un id', () => forge('{"$ne":null}')],
        ['d’un compte supprimé', () => forge(new Types.ObjectId().toHexString())]
    ])('jeton %s → 401', async (_label, makeToken) => {
        const res = await request(app).get('/api/users/me').set(auth(makeToken()));
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('schéma autre que Bearer → 401', async () => {
        const res = await request(app).get('/api/users/me').set('Authorization', `Basic ${account.token}`);
        expect(res.status).toBe(401);
    });

    test('le jeton n’est jamais accepté dans l’URL', async () => {
        const res = await request(app).get(`/api/users/me?token=${account.token}`);
        expect(res.status).toBe(401);
    });
});

describe('Injections (A03)', () => {
    test('injection NoSQL dans la connexion → 400, jamais de connexion', async () => {
        await register({ email: 'victime@helpup.test' });
        for (const body of [
            { email: { $ne: null }, password: { $ne: null } },
            { email: 'victime@helpup.test', password: { $gt: '' } },
            { email: { $regex: '.*' }, password: 'password123' }
        ]) {
            const res = await request(app).post('/api/auth/login').send(body);
            expect(res.status).toBe(400);
            expect(res.body.token).toBeUndefined();
        }
    });

    test('opérateur Mongo dans les paramètres d’URL → 400', async () => {
        const account = await register();
        const res = await request(app).get('/api/explore/missions?category[$ne]=jardinage').set(auth(account.token));
        expect(res.status).toBe(400);
    });

    test('caractères spéciaux d’expression régulière dans la recherche : traités comme du texte', async () => {
        const owner = await register();
        const searcher = await register();
        await Mission.create({
            ownerId: owner.id,
            title: 'Réparer (vite) un vélo',
            description: 'Crevaison à réparer, matériel fourni.',
            rewardCents: 1500,
            estimatedMinutes: 30,
            category: 'bricolage',
            scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
            quartier: 'villejuif-centre',
            location: { type: 'Point', coordinates: [2.364, 48.7875] }
        });
        const literal = await request(app).get('/api/explore/missions?q=(vite)').set(auth(searcher.token));
        expect(literal.status).toBe(200);
        expect(literal.body.items).toHaveLength(1);

        // « .* » ne doit pas tout renvoyer : c'est cherché littéralement
        const wildcard = await request(app).get('/api/explore/missions?q=.*').set(auth(searcher.token));
        expect(wildcard.body.items).toHaveLength(0);
    });

    test('__proto__ dans le corps : refusé, aucune pollution de prototype', async () => {
        const account = await register();
        const res = await request(app)
            .patch('/api/users/me')
            .set(auth(account.token))
            .set('Content-Type', 'application/json')
            .send('{"__proto__":{"role":"admin"},"city":"Villejuif"}');
        expect(res.status).toBe(400);
        expect(({} as Record<string, unknown>).role).toBeUndefined();
        expect((await User.findById(account.id))?.role).toBe('client');
    });
});

describe('Contrôle d’accès (A01)', () => {
    test('élévation de privilège à l’inscription ou sur son profil → 400', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'pirate@helpup.test',
            password: 'password123',
            firstName: 'Pirate',
            lastName: 'Testeur',
            role: 'admin'
        });
        expect(res.status).toBe(400);

        const account = await register();
        const patch = await request(app).patch('/api/users/me').set(auth(account.token)).send({ role: 'admin' });
        expect(patch.status).toBe(400);
        expect((await User.findById(account.id))?.role).toBe('client');
    });

    test('routes d’administration interdites à un membre → 403', async () => {
        const member = await register();
        const other = await register();
        const missionId = new Types.ObjectId().toHexString();

        expect((await request(app).delete(`/api/missions/${missionId}`).set(auth(member.token))).status).toBe(403);
        expect((await request(app).delete(`/api/users/${other.id}`).set(auth(member.token))).status).toBe(403);
        expect((await request(app).patch(`/api/users/${other.id}/role`).set(auth(member.token)).send({ role: 'admin' })).status).toBe(403);
    });

    test('les réponses ne contiennent jamais le hash du mot de passe', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'secret@helpup.test',
            password: 'password123',
            firstName: 'Secret',
            lastName: 'Testeur'
        });
        const login = await request(app).post('/api/auth/login').send({ email: 'secret@helpup.test', password: 'password123' });
        for (const body of [res.body, login.body]) {
            expect(JSON.stringify(body)).not.toMatch(/passwordHash|\$2[aby]\$/);
        }
    });
});

describe('Mots de passe et volume des requêtes', () => {
    test('mot de passe de plus de 72 octets (accents) → 400 au lieu d’être tronqué', async () => {
        // 40 caractères, mais 80 octets en UTF-8 : bcrypt ignorerait la fin
        const res = await request(app).post('/api/auth/register').send({
            email: 'accents@helpup.test',
            password: 'é'.repeat(40),
            firstName: 'Accent',
            lastName: 'Testeur'
        });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    test('corps de plus de 100 ko → 413 au format commun (et non 500)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ email: 'a@b.fr', password: 'x'.repeat(200 * 1024) }));
        expect(res.status).toBe(413);
        expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    test('mêmes message et code pour un email inconnu et un mauvais mot de passe', async () => {
        await register({ email: 'connu@helpup.test' });
        const unknown = await request(app).post('/api/auth/login').send({ email: 'inconnu@helpup.test', password: 'password123' });
        const wrong = await request(app).post('/api/auth/login').send({ email: 'connu@helpup.test', password: 'mauvais-mot' });
        expect(unknown.status).toBe(401);
        expect(wrong.status).toBe(401);
        expect(unknown.body).toEqual(wrong.body);
    });
});

// En dernier : ce bloc épuise le quota de connexion de l'adresse IP des tests
describe('Limitation de débit (force brute)', () => {
    // La limitation est coupée sous Jest ; on la réactive seulement ici (les requêtes ignorées ne comptent pas)
    beforeAll(() => {
        process.env.RATE_LIMIT_IN_TESTS = 'true';
    });

    test('10 échecs de connexion, puis 429 ; les connexions réussies ne comptent pas', async () => {
        await register({ email: 'cible@helpup.test' });

        // Une démo qui change souvent de compte n'est jamais bloquée
        for (let i = 0; i < 12; i += 1) {
            const ok = await request(app).post('/api/auth/login').send({ email: 'cible@helpup.test', password: 'password123' });
            expect(ok.status).toBe(200);
        }

        for (let i = 0; i < 10; i += 1) {
            const fail = await request(app).post('/api/auth/login').send({ email: 'cible@helpup.test', password: `essai-${i}-faux` });
            expect(fail.status).toBe(401);
        }

        const blocked = await request(app).post('/api/auth/login').send({ email: 'cible@helpup.test', password: 'password123' });
        expect(blocked.status).toBe(429);
        expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
        expect(blocked.headers['retry-after']).toBeDefined();
    });
});
