// Resets the products collection with the sample data.
// Usage: npm run seed
require("dotenv").config();

const { MongoClient } = require("mongodb");
const sampleProducts = require("./sampleProducts");

async function seed() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "shopping_cart_db";
  const collectionName = process.env.MONGODB_COLLECTION || "products";

  if (!uri) {
    console.error("MONGODB_URI is not set. Create backend/.env from backend/.env.example first.");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const products = client.db(dbName).collection(collectionName);
    await products.deleteMany({});
    await products.createIndex({ productId: 1 }, { unique: true });
    const result = await products.insertMany(sampleProducts.map((p) => ({ ...p })));
    console.log(`Inserted ${result.insertedCount} sample products into ${dbName}.${collectionName}`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();
