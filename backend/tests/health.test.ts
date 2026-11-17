import request from 'supertest'
import app from '../src/api/app'

test('GET /api/health renvoie 200 {status:"ok"}', async () => {
  const res = await request(app).get('/api/health')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok' })
})
