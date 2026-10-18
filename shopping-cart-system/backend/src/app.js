const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
      : true,
  })
);
app.use(express.json());

// ---------- Helpers ----------

/** Generates the next id such as P009 based on the highest existing "P###" id. */
async function generateProductId(collection) {
  const docs = await collection
    .find({ productId: /^P\d+$/ }, { projection: { productId: 1 } })
    .toArray();
  const max = docs.reduce((m, d) => Math.max(m, parseInt(d.productId.slice(1), 10)), 0);
  return `P${String(max + 1).padStart(3, "0")}`;
}

/** Validates the body of POST /api/products. Returns { errors, value }. */
function validateProduct(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};

  const productName = typeof b.productName === "string" ? b.productName.trim() : "";
  const category = typeof b.category === "string" ? b.category.trim() : "";
  const productId = typeof b.productId === "string" ? b.productId.trim() : "";
  const price = typeof b.price === "string" && b.price.trim() !== "" ? Number(b.price) : b.price;

  if (!productName) errors.push("productName is required and must be a non-empty string.");
  if (!category) errors.push("category is required and must be a non-empty string.");
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    errors.push("price is required and must be a number greater than or equal to 0.");
  }
  if (b.productId !== undefined && b.productId !== null && b.productId !== "" && !productId) {
    errors.push("productId, if provided, must be a non-empty string.");
  }

  return { errors, value: { productId, productName, price, category } };
}

// ---------- Routes ----------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/products -> all products
app.get("/api/products", async (req, res, next) => {
  try {
    const products = await db.getProductsCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ productId: 1 })
      .toArray();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST /api/products -> add a product
app.post("/api/products", async (req, res, next) => {
  try {
    const { errors, value } = validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed.", details: errors });
    }

    const collection = db.getProductsCollection();
    const product = {
      productId: value.productId || (await generateProductId(collection)),
      productName: value.productName,
      price: value.price,
      category: value.category,
    };

    await collection.insertOne({ ...product });
    res.status(201).json(product);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "A product with this productId already exists." });
    }
    next(err);
  }
});

// ---------- Error handling ----------

app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error. Please try again." });
});

module.exports = app;
