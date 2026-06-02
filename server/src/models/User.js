import { getDb } from "../db/index.js";
import { saveDbToDisk } from "../db/index.js";
import bcrypt from "bcryptjs";

export function createUser(username, password, displayName) {
  const db = getDb();
  const hash = bcrypt.hashSync(password, 10);
  db.run(
    "INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)",
    [username, hash, displayName || username],
  );
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0].values[0][0];
  saveDbToDisk();
  return { id, username, displayName: displayName || username };
}

export function findUserByUsername(username) {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM users WHERE username = ?",
    [username],
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0];
  const obj = {};
  row.columns.forEach((col, i) => { obj[col] = row.values[0][i]; });
  return obj;
}

export function findUserById(id) {
  const db = getDb();
  const result = db.exec(
    "SELECT id, username, display_name, avatar_color, created_at FROM users WHERE id = ?",
    [id],
  );
  if (!result.length || !result[0].values.length) return null;
  const row = result[0];
  const obj = {};
  row.columns.forEach((col, i) => { obj[col] = row.values[0][i]; });
  return obj;
}

export function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateLastLogin(id) {
  const db = getDb();
  db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  saveDbToDisk();
}

function rowsToArray(result) {
  if (!result.length || !result[0].values.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export function searchUsers(query) {
  const db = getDb();
  const result = db.exec(
    "SELECT id, username, display_name, avatar_color FROM users WHERE username LIKE ? LIMIT 10",
    [`%${query}%`],
  );
  return rowsToArray(result);
}
