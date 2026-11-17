import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import exploreRoutes from './routes/explore.routes'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'

const app = express()

app.use(helmet())
// L'authentification passe par l'en-tête Authorization (pas de cookie) : pas besoin de credentials.
// Sans CORS_ORIGIN, on n'autorise que le front Vite local.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/explore', exploreRoutes)

app.use('/api', notFoundHandler)
app.use(errorHandler)

export default app
