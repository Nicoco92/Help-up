const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }))

module.exports = app
