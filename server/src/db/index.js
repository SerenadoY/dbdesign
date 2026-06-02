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
  saveDbToDisk();
  return db;
}

export function saveDbToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(config.databaseUrl, buffer);
}
