import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import exploreRoutes from './routes/explore.routes'
import missionRoutes from './routes/missions.routes'
import applicationRoutes from './routes/applications.routes'
import missionApplicationRoutes from './routes/missionApplications.routes'
import dashboardRoutes from './routes/dashboard.routes'
import reviewRoutes from './routes/reviews.routes'
import userReviewRoutes from './routes/userReviews.routes'
import notificationRoutes from './routes/notifications.routes'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'
import { apiLimiter } from './middlewares/rateLimit.middleware'
import { noStore } from './middlewares/security.middleware'
import { loadOpenApi } from './utils/openapi'

// Contrat OpenAPI : src/api/openapi/ (copié dans dist/api/openapi au build)
const openapi = loadOpenApi(path.join(__dirname, 'openapi', 'openapi.yaml'))

const app = express()

// Derrière un reverse proxy (production), TRUST_PROXY=1 permet de lire la vraie IP du client
// (limitation de débit, journal de sécurité). En local, aucune confiance dans X-Forwarded-For.
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false)
// Paramètres d'URL toujours de simples chaînes : ?status[$ne]=x ne devient jamais un objet Mongo
app.set('query parser', 'simple')

// En-têtes de sécurité (CSP, HSTS, nosniff, frame-ancestors, Referrer-Policy…) ; X-Powered-By retiré
app.use(helmet())
// L'authentification passe par l'en-tête Authorization (pas de cookie) : pas de credentials,
// donc pas de CSRF possible. Une liste d'origines peut être donnée, séparées par des virgules.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim())
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE'], maxAge: 600 }))
app.use('/api', apiLimiter)
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Documentation interactive : http://localhost:3000/api/docs (contrat assemblé en JSON : /api/docs/openapi.json)
app.get('/api/docs/openapi.json', (_req, res) => {
  res.status(200).json(openapi)
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { showExtensions: true } }))

// Aucune mise en cache des réponses métier (la documentation, elle, peut l'être)
app.use(['/api/auth', '/api/users', '/api/explore', '/api/missions', '/api/applications', '/api/dashboard', '/api/reviews', '/api/notifications'], noStore)

app.use('/api/auth', authRoutes)
// Avant userRoutes : /api/users/:id/reviews ne passe pas deux fois par requireAuth
app.use('/api/users', userReviewRoutes)
app.use('/api/users', userRoutes)
app.use('/api/explore', exploreRoutes)
// Avant missionRoutes : /api/missions/:id/applications ne passe pas deux fois par requireAuth
app.use('/api/missions', missionApplicationRoutes)
app.use('/api/missions', missionRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)

app.use('/api', notFoundHandler)
app.use(errorHandler)

export default app
