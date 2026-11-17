import 'dotenv/config'
import jwt from 'jsonwebtoken'
import mongoose, { Types } from 'mongoose'

async function createToken(email: string) {
  const { MONGODB_URI, JWT_SECRET } = process.env
  if (!MONGODB_URI || !JWT_SECRET) {
    throw new Error('MONGODB_URI et JWT_SECRET doivent être définis.')
  }

  await mongoose.connect(MONGODB_URI)
  try {
    const user = await mongoose.connection.collection<{ _id: Types.ObjectId }>('users').findOne(
      { email: email.trim().toLowerCase() },
      { projection: { _id: 1 } },
    )
    if (!user) {
      throw new Error(`Aucun compte de démonstration trouvé pour ${email}.`)
    }

    return jwt.sign({ sub: user._id.toHexString() }, JWT_SECRET, { expiresIn: 3600 })
  } finally {
    await mongoose.disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  throw new Error('Usage : npx tsx scripts/dev-explore-token.ts <email>')
}

createToken(email)
  .then((token) => console.log(token))
  .catch((error: unknown) => {
    console.error('Impossible de créer le jeton de démonstration.', error)
    process.exitCode = 1
  })
