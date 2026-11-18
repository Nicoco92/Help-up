import request from 'supertest';
import app from '../src/api/app';

type Spec = {
    paths: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
};

// Toutes les valeurs de $ref du document assemblé
function collectRefs(node: unknown, refs: string[] = []): string[] {
    if (Array.isArray(node)) node.forEach((item) => collectRefs(item, refs));
    else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
            if (key === '$ref' && typeof value === 'string') refs.push(value);
            else collectRefs(value, refs);
        }
    }
    return refs;
}

function follow(spec: unknown, ref: string): unknown {
    return ref
        .slice(2)
        .split('/')
        .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], spec);
}

describe('Documentation Swagger', () => {
    test('GET /api/docs/ renvoie la page Swagger UI', async () => {
        const res = await request(app).get('/api/docs/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('swagger-ui');
    });
});

describe('Contrat OpenAPI (dossier api/)', () => {
    let spec: Spec;

    beforeAll(async () => {
        const res = await request(app).get('/api/docs/openapi.json');
        expect(res.status).toBe(200);
        spec = res.body;
    });

    test('toutes les références sont locales et pointent vers un composant existant', () => {
        const refs = collectRefs(spec);
        expect(refs.length).toBeGreaterThan(0);
        for (const ref of refs) {
            expect(ref).toMatch(/^#\/components\//);
            expect(follow(spec, ref)).toBeDefined();
        }
    });

    test.each([
        ['/api/users', ['get']],
        ['/api/users/me', ['get', 'patch', 'delete']],
        ['/api/users/{id}', ['get', 'delete']],
        ['/api/missions', ['get', 'post']],
        ['/api/missions/{id}', ['get', 'patch', 'delete']],
        ['/api/missions/{id}/complete', ['post']],
        ['/api/missions/{id}/applications', ['get']],
        ['/api/missions/{id}/applications/{applicationId}/accept', ['post']],
        ['/api/missions/{id}/applications/{applicationId}/reject', ['post']],
        ['/api/applications', ['get', 'post']],
        ['/api/applications/{id}', ['get', 'patch', 'delete']],
        ['/api/dashboard', ['get']],
        ['/api/reviews', ['get', 'post']],
        ['/api/reviews/{id}', ['get', 'patch', 'delete']],
        ['/api/users/{id}/reviews', ['get']],
        ['/api/notifications', ['get']],
        ['/api/notifications/unread-count', ['get']],
        ['/api/notifications/read-all', ['post']],
        ['/api/notifications/{id}', ['get', 'patch', 'delete']],
        ['/api/conversations', ['get']],
        ['/api/conversations/unread-count', ['get']],
        ['/api/conversations/{id}', ['get']],
        ['/api/conversations/{id}/messages', ['get', 'post']],
    ])('%s expose %j', (route, methods) => {
        expect(spec.paths[route]).toBeDefined();
        for (const method of methods) expect(spec.paths[route][method]).toBeDefined();
    });

    test('chaque opération a un operationId unique et un x-status', () => {
        const ids = new Set<string>();
        for (const item of Object.values(spec.paths)) {
            for (const [method, op] of Object.entries(item)) {
                if (method === 'parameters') continue;
                const { operationId, 'x-status': status } = op as Record<string, string>;
                expect(ids.has(operationId)).toBe(false);
                ids.add(operationId);
                expect(['implemented', 'todo']).toContain(status);
            }
        }
    });
});
