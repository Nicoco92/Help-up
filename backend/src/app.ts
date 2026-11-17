import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import exploreRoutes from './routes/explore.routes'
import missionRoutes from './routes/missions.routes'
import applicationRoutes from './routes/applications.routes'
import missionApplicationRoutes from './routes/missionApplications.routes'
import dashboardRoutes from './routes/dashboard.routes'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'

// Documentation OpenAPI (src/docs/openapi.yaml, copié dans dist/docs au build)
const openapi = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'))

const app = express()

app.use(helmet())
// L'authentification passe par l'en-tête Authorization (pas de cookie) : pas besoin de credentials.
// Sans CORS_ORIGIN, on n'autorise que le front Vite local.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Documentation interactive : http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/explore', exploreRoutes)
app.use('/api/missions', missionRoutes)
app.use('/api/missions', missionApplicationRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use('/api', notFoundHandler)
app.use(errorHandler)

export default app
