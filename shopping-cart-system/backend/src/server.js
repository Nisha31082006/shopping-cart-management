require("dotenv").config();

const app = require("./app");
const { connectToDatabase, closeDatabase } = require("./db");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error("\nFailed to connect to MongoDB:", err.message);
    console.error("Make sure MongoDB is running and MONGODB_URI in backend/.env is correct.\n");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("\nShutting down...");
    server.close();
    await closeDatabase();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
