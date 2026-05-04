import { MongoClient, ServerApiVersion } from 'mongodb'

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://nameispassword:nameispassword@cluster0.7qfrkde.mongodb.net/?appName=Cluster0'

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGO_URI, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(MONGO_URI, options)
  clientPromise = client.connect()
}

export default clientPromise
