// Route tests using Node's built-in test runner (no MongoDB needed).
// The MongoDB collection is replaced by a tiny in-memory fake so the
// Express routes, validation and error handling can be verified quickly.
// Run with: npm run test:api
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const db = require("../src/db");
const sampleProducts = require("../src/sampleProducts");

function makeFakeCollection(initial) {
  const rows = initial.map((r) => ({ ...r }));
  const project = (r) => {
    const { _id, ...rest } = r;
    return rest;
  };
  return {
    find(filter = {}, options = {}) {
      let result = rows.filter((r) =>
        Object.entries(filter).every(([k, v]) => (v instanceof RegExp ? v.test(r[k]) : r[k] === v))
      );
      const api = {
        sort(spec) {
          const [key] = Object.keys(spec);
          result = [...result].sort((a, b) => (a[key] > b[key] ? 1 : -1));
          return api;
        },
        async toArray() {
          const p = options.projection;
          if (p && p._id === 0) return result.map(project);
          if (p && p.productId === 1) return result.map((r) => ({ productId: r.productId }));
          return result.map((r) => ({ ...r }));
        },
      };
      return api;
    },
    async insertOne(doc) {
      if (rows.some((r) => r.productId === doc.productId)) {
        const err = new Error("E11000 duplicate key");
        err.code = 11000;
        throw err;
      }
      rows.push({ ...doc });
      return { acknowledged: true };
    },
  };
}

const fake = makeFakeCollection(sampleProducts);
db.getProductsCollection = () => fake;

const app = require("../src/app");

let server;
let base;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

const post = (body, raw) =>
  fetch(`${base}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw !== undefined ? raw : JSON.stringify(body),
  });

test("GET /api/products returns all sample products without _id", async () => {
  const res = await fetch(`${base}/api/products`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.length, sampleProducts.length);
  assert.deepEqual(Object.keys(data[0]).sort(), ["category", "price", "productId", "productName"]);
});

test("POST /api/products creates a product with an auto-generated productId", async () => {
  const res = await post({ productName: "USB-C Cable", price: 399, category: "Electronics" });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.productId, "P009");
  assert.equal(created.price, 399);

  const list = await (await fetch(`${base}/api/products`)).json();
  assert.ok(list.some((p) => p.productId === "P009"));
});

test("POST /api/products accepts a price sent as a numeric string", async () => {
  const res = await post({ productName: "Pen", price: "25", category: "Stationery" });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).price, 25);
});

test("POST /api/products rejects invalid input with 400", async () => {
  for (const body of [
    {},
    { productName: "", price: 10, category: "X" },
    { productName: "A", price: -5, category: "X" },
    { productName: "A", price: "abc", category: "X" },
    { productName: "A", price: 10 },
  ]) {
    const res = await post(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok((await res.json()).error);
  }
});

test("POST /api/products returns 409 for a duplicate productId", async () => {
  const res = await post({ productId: "P001", productName: "Dup", price: 1, category: "X" });
  assert.equal(res.status, 409);
});

test("POST /api/products returns 400 for malformed JSON", async () => {
  const res = await post(undefined, "{ not json");
  assert.equal(res.status, 400);
});

test("Unknown API route returns 404 JSON", async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

test("Database failures return a 500 JSON error", async () => {
  const original = db.getProductsCollection;
  db.getProductsCollection = () => {
    throw new Error("boom");
  };
  const origError = console.error;
  console.error = () => {};
  try {
    const res = await fetch(`${base}/api/products`);
    assert.equal(res.status, 500);
    assert.ok((await res.json()).error);
  } finally {
    console.error = origError;
    db.getProductsCollection = original;
  }
});
