import request from 'supertest';
import app from '../src/app';

describe('Documentation Swagger', () => {
    test('GET /api/docs/ renvoie la page Swagger UI', async () => {
        const res = await request(app).get('/api/docs/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('swagger-ui');
    });
});
