const { MongoClient } = require("mongodb");
const sampleProducts = require("./sampleProducts");

let client = null;
let db = null;

function getConfig() {
  return {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || "shopping_cart_db",
    collectionName: process.env.MONGODB_COLLECTION || "products",
  };
}

/**
 * Connects to MongoDB using the native driver (no Mongoose),
 * creates a unique index on productId and seeds sample data
 * if the collection is empty.
 */
async function connectToDatabase() {
  const { uri, dbName, collectionName } = getConfig();

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy backend/.env.example to backend/.env and set MONGODB_URI."
    );
  }

  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(dbName);

  const products = db.collection(collectionName);
  await products.createIndex({ productId: 1 }, { unique: true });

  const count = await products.countDocuments();
  if (count === 0) {
    await products.insertMany(sampleProducts.map((p) => ({ ...p })));
    console.log(`Seeded ${sampleProducts.length} sample products into "${collectionName}".`);
  }

  console.log(`Connected to MongoDB database "${dbName}".`);
  return db;
}

function getProductsCollection() {
  if (!db) {
    throw new Error("Database is not connected yet.");
  }
  return db.collection(getConfig().collectionName);
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectToDatabase, getProductsCollection, closeDatabase };
