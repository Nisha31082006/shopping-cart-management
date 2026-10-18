# Shopping Cart Management System

A full-stack shopping cart app built with **React (Vite)**, **Node.js**, **Express.js** and the **MongoDB Native Driver** (no Mongoose).

```
shopping-cart-system/
├── backend/                 Express API + MongoDB native driver
│   ├── src/
│   │   ├── app.js           Express app, routes, validation, error handling
│   │   ├── db.js            MongoDB connection, unique index, auto-seeding
│   │   ├── sampleProducts.js
│   │   ├── seed.js          npm run seed  (resets sample data)
│   │   └── server.js        Entry point
│   ├── test/api.test.js     Route tests (npm run test:api)
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/                React app (Vite)
│   ├── src/
│   │   ├── components/Product.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js       Proxies /api -> http://localhost:5000
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── .vscode/                 VS Code tasks and settings
├── .gitignore
└── README.md
```

---

## 1. Prerequisites (Windows)

| Tool | Version | Check with |
|------|---------|-----------|
| Node.js (LTS) | 18 or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| MongoDB Community Server | 6.0 or newer | `mongod --version` |
| VS Code | any recent | |

Download links: <https://nodejs.org> and <https://www.mongodb.com/try/download/community>

---

## 2. Install and configure MongoDB (Windows)

**Option A: Local MongoDB (recommended)**

1. Run the MongoDB Community Server `.msi` installer, choose **Complete**, and keep **"Install MongoDB as a Service"** ticked (Run service as *Network Service user*). MongoDB Compass (GUI) is optional.
2. Open **Command Prompt as Administrator** and confirm the service is running:

```bat
sc query MongoDB
```

If the state is not `RUNNING`, start it:

```bat
net start MongoDB
```

3. The default connection string is `mongodb://127.0.0.1:27017`. The database `shopping_cart_db` and the `products` collection are created automatically on the first run.

If `mongod` is not recognised in the terminal, you do not need it: the service is already running. (Optional: add `C:\Program Files\MongoDB\Server\<version>\bin` to your PATH.)

**Option B: MongoDB Atlas (cloud)**

Create a free cluster at <https://www.mongodb.com/atlas>, add a database user, allow your IP under *Network Access*, copy the `mongodb+srv://...` connection string and put it in `backend\.env` as `MONGODB_URI`.

---

## 3. Open the project in VS Code

Extract the ZIP, then in Command Prompt or PowerShell:

```bat
cd path\to\shopping-cart-system
code .
```

In VS Code open the integrated terminal with **Ctrl + `** (you will use two terminals).

---

## 4. Backend: install, configure, start (Terminal 1)

```bat
cd backend
npm install
copy .env.example .env
npm start
```

Expected output:

```
Seeded 8 sample products into "products".
Connected to MongoDB database "shopping_cart_db".
Backend running at http://localhost:5000
```

(The "Seeded..." line appears only the first time, when the collection is empty.)

Environment variables live in `backend\.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `shopping_cart_db` | Database name |
| `MONGODB_COLLECTION` | `products` | Collection name |
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

Useful extras:

```bat
npm run seed        :: wipe the collection and re-insert the 8 sample products
npm run test:api    :: run the API route tests (no MongoDB needed)
npm run dev         :: start with auto-restart on file changes
```

---

## 5. Frontend: install and run (Terminal 2)

```bat
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server forwards `/api/*` requests to the backend on port 5000, so no CORS setup is needed. Keep the backend terminal running.

To create a production build: `npm run build` (output in `frontend\dist`).

---

## 6. REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Returns all products |
| POST | `/api/products` | Adds a product |
| GET | `/api/health` | Health check |

`POST /api/products` body:

```json
{ "productName": "USB-C Cable", "price": 399, "category": "Electronics" }
```

`productId` is optional; if omitted, the next id (`P009`, `P010`, ...) is generated. Responses: `201` created, `400` validation error, `409` duplicate `productId`, `500` server error.

Test from the terminal (Command Prompt):

```bat
curl http://localhost:5000/api/products
curl -X POST http://localhost:5000/api/products -H "Content-Type: application/json" -d "{\"productName\":\"USB-C Cable\",\"price\":399,\"category\":\"Electronics\"}"
```

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to connect to MongoDB: connect ECONNREFUSED` | MongoDB is not running. Run `net start MongoDB` in an Administrator terminal. |
| `MONGODB_URI is not set` | Run `copy .env.example .env` inside `backend`. |
| Page shows "Cannot reach the server" | Start the backend first (`npm start` in `backend`). |
| `EADDRINUSE: port 5000` | Change `PORT` in `backend\.env` **and** the proxy target in `frontend\vite.config.js`. |
| PowerShell blocks `npm` scripts | Use Command Prompt, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |

---

## 8. How the assignment requirements are implemented

**(i) Functional component and props**: `frontend/src/components/Product.jsx` defines the functional component `Product({ productId, productName, price, category })`. It receives `productName` and `price` as props (plus `productId` and `category`) and renders them with JSX. `App.jsx` maps over the products fetched from MongoDB and renders one `<Product />` per item. Sample products (`productId`, `productName`, `price`, `category`) are in `backend/src/sampleProducts.js` and are stored in MongoDB.

**(ii) State with `useState()`**: inside `Product`, `const [currentPrice, setCurrentPrice] = useState(price)` stores the displayed price. The **Apply ₹200 Discount** button calls `setCurrentPrice(prev => Math.max(0, prev - 200))`, so the price drops by ₹200 immediately (no reload) and can never go below ₹0 (the button is disabled at ₹0). Because each `<Product />` has its own state, every card keeps its own price and the original price is shown struck through after a discount.

**(iii) `useEffect()`**: in `App.jsx`, `useEffect(() => { console.log("Shopping Cart System Loaded"); }, [])` prints the exact message once when the component mounts. The empty dependency array `[]` makes it run only on initial mount. Open the browser DevTools console (F12) to see it. (`StrictMode` is deliberately not used so the message prints once in development.)
