import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { z } from 'zod';
import app from '../src/app';
import AppError from '../src/utils/AppError';
import { validate } from '../src/middlewares/validate';
import { errorHandler, notFound } from '../src/middlewares/errorHandler';

// Mini application de test : une route par cas d'erreur, sans base de données
const testApp = express();
testApp.use(express.json());
testApp.post('/validate', validate(z.strictObject({ title: z.string().min(5) })), (req, res) => {
    res.status(201).json(req.body);
});
testApp.get('/app-error', () => {
    throw AppError.notFound('Mission not found');
});
testApp.get('/cast-error', () => {
    throw new mongoose.Error.CastError('ObjectId', 'abc', '_id');
});
testApp.get('/duplicate', () => {
    throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
});
testApp.get('/crash', () => {
    throw new Error('secret internal detail');
});
testApp.use(notFound);
testApp.use(errorHandler);

describe('Format des erreurs', () => {
    // Le serveur ne doit pas polluer la sortie des tests avec le console.error du 500
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('route inconnue → 404 NOT_FOUND', async () => {
        const res = await request(app).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Missing route' } });
    });

    test('JSON mal formé → 400 INVALID_INPUT', async () => {
        const res = await request(app)
            .post('/api/missions')
            .set('Content-Type', 'application/json')
            .send('{"title":');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    test('AppError → son statut et son code', async () => {
        const res = await request(testApp).get('/app-error');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    });

    test('id mal formé (CastError) → 400 INVALID_INPUT', async () => {
        const res = await request(testApp).get('/cast-error');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    test('doublon sur un index unique → 409 CONFLICT', async () => {
        const res = await request(testApp).get('/duplicate');
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');
    });

    test('erreur imprévue → 500 sans détail interne', async () => {
        const res = await request(testApp).get('/crash');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
    });
});

describe('validate', () => {
    test('corps valide → passe au contrôleur', async () => {
        const res = await request(testApp).post('/validate').send({ title: 'Tondre la pelouse' });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ title: 'Tondre la pelouse' });
    });

    test('champ invalide → 400 INVALID_INPUT', async () => {
        const res = await request(testApp).post('/validate').send({ title: 'abc' });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    test('champ inconnu (ex. ownerId) → 400 INVALID_INPUT', async () => {
        const res = await request(testApp).post('/validate').send({ title: 'Tondre la pelouse', ownerId: '123' });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_INPUT');
    });
});
