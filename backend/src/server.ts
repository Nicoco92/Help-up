import 'dotenv/config'
import mongoose from 'mongoose'
import app from './api/app'

const PORT = Number(process.env.PORT) || 3000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant (fichier d’environnement à la racine du projet)')
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant (fichier d’environnement à la racine du projet)')
}

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => console.log(`API HelpUP sur http://localhost:${PORT}`))
})
