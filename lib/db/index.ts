import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const dbPath = "bank.db";

// Single connection for entire application
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// PERF-408
// SEC-301
// Create tables if they don't exist (run once at startup)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    ssn_hash TEXT NOT NULL,
    ssn_last4 TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL,
    balance REAL DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Graceful shutdown: close the SQLite connection when the Node process exits
function closeSqliteConnection() {
  try {
    sqlite.close();
    // eslint-disable-next-line no-console
    console.log("SQLite connection closed gracefully.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Error closing SQLite connection:", err);
  }
}

process.on("SIGINT", () => {
  closeSqliteConnection();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeSqliteConnection();
  process.exit(0);
});

// beforeExit is emitted before the event loop is empty - ensures connection is close even if nothing else is keeping Node alive
process.on("beforeExit", () => {
  closeSqliteConnection();
});

process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception, closing SQLite connection:", err);
  closeSqliteConnection();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled rejection, closing SQLite connection:", reason);
  closeSqliteConnection();
});
