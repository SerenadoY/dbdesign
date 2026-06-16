import initSqlJs from "sql.js";
import { config } from "../config.js";
import { migrate } from "./migrate.js";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { dirname } from "path";

let db = null;

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export async function initDb() {
  const SQL = await initSqlJs();

  const dbDir = dirname(config.databaseUrl);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (existsSync(config.databaseUrl)) {
    const buffer = readFileSync(config.databaseUrl);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  migrate(db);
  saveDbToDiskImmediate();
  return db;
}

let debounceTimer = null;
const DEBOUNCE_MS = 500;

export function saveDbToDiskImmediate() {
  if (!db) return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.databaseUrl, buffer);
}

export function saveDbToDisk() {
  if (!db) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(config.databaseUrl, buffer);
  }, DEBOUNCE_MS);
}
