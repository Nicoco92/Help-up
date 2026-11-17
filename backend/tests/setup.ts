import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer: MongoMemoryServer | null = null

export async function connectTestDb(): Promise<void> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create()
  }
  const uri = mongoServer.getUri()
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  }
}

export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({})
    }
  }
}

export async function closeTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}
