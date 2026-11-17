import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import exploreRoutes from './routes/explore.routes'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/explore', exploreRoutes)

export default app
