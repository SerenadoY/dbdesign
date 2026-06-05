import { getDb, saveDbToDisk } from "../db/index.js";
import { nanoid } from "nanoid";

function rowsToArray(result) {
  if (!result.length || !result[0].values.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function rowToObject(result) {
  if (!result.length || !result[0].values.length) return null;
  const row = result[0];
  const obj = {};
  row.columns.forEach((col, i) => { obj[col] = row.values[0][i]; });
  return obj;
}

export function getDiagramsByUser(userId) {
  const db = getDb();
  const owned = rowsToArray(
    db.exec(
      `SELECT d.*, u.display_name as owner_display_name
       FROM diagrams d
       JOIN users u ON d.owner_id = u.id
       WHERE d.owner_id = ?
       ORDER BY d.updated_at DESC`,
      [userId],
    ),
  );
  const collaborated = rowsToArray(
    db.exec(
      `SELECT d.*, u.display_name as owner_display_name
       FROM diagrams d
       JOIN diagram_collaborators dc ON d.id = dc.diagram_id
       JOIN users u ON d.owner_id = u.id
       WHERE dc.user_id = ?
       ORDER BY d.updated_at DESC`,
      [userId],
    ),
  );
  const seen = new Set();
  return [...owned, ...collaborated].filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
}

export function getDiagramById(id) {
  const db = getDb();
  return rowToObject(db.exec("SELECT * FROM diagrams WHERE id = ?", [id]));
}

export function createDiagram(ownerId, title, databaseType, diagramData) {
  const db = getDb();
  const id = nanoid();
  db.run(
    "INSERT INTO diagrams (id, title, owner_id, diagram_data, database_type) VALUES (?, ?, ?, ?, ?)",
    [id, title || "未命名设计", ownerId, JSON.stringify(diagramData || {}), databaseType || "mysql"],
  );
  db.run(
    "INSERT INTO diagram_collaborators (diagram_id, user_id, role) VALUES (?, ?, 'owner')",
    [id, ownerId],
  );
  saveDbToDisk();
  return { id, title: title || "未命名设计" };
}

export function updateDiagram(id, updates) {
  const db = getDb();
  const fields = [];
  const values = [];
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.diagramData !== undefined) { fields.push("diagram_data = ?"); values.push(JSON.stringify(updates.diagramData)); }
  if (updates.databaseType !== undefined) { fields.push("database_type = ?"); values.push(updates.databaseType); }
  if (fields.length === 0) return null;
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  db.run(`UPDATE diagrams SET ${fields.join(", ")} WHERE id = ?`, values);
  saveDbToDisk();
  return getDiagramById(id);
}

export function incrementVersion(diagramId) {
  const db = getDb();
  db.run("UPDATE diagrams SET version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [diagramId]);
  saveDbToDisk();
  const result = db.exec("SELECT version FROM diagrams WHERE id = ?", [diagramId]);
  if (!result.length || !result[0].values.length) return 0;
  return result[0].values[0][0];
}

export function saveSnapshot(diagramId, userId, diagramData, message) {
  const db = getDb();
  const version = incrementVersion(diagramId);
  db.run(
    "INSERT INTO version_snapshots (diagram_id, user_id, version, diagram_data, message) VALUES (?, ?, ?, ?, ?)",
    [diagramId, userId, version, JSON.stringify(diagramData), message || ""],
  );
  saveDbToDisk();
  return { version };
}

export function getVersions(diagramId) {
  const db = getDb();
  return rowsToArray(
    db.exec(
      `SELECT vs.id, vs.version, vs.message, vs.created_at,
              u.display_name as user_name
       FROM version_snapshots vs
       LEFT JOIN users u ON vs.user_id = u.id
       WHERE vs.diagram_id = ?
       ORDER BY vs.version DESC`,
      [diagramId],
    ),
  );
}

export function getSnapshot(diagramId, version) {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM version_snapshots WHERE diagram_id = ? AND version = ?",
    [diagramId, version],
  );
  if (!result.length || !result[0].values.length) return null;
  const obj = {};
  result[0].columns.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj;
}

export function restoreSnapshot(diagramId, version) {
  const snapshot = getSnapshot(diagramId, version);
  if (!snapshot) return null;
  const diagramData = JSON.parse(snapshot.diagram_data || "{}");
  updateDiagram(diagramId, { diagramData });
  return diagramData;
}

export function copyDiagram(id, newOwnerId) {
  const db = getDb();
  const original = getDiagramById(id);
  if (!original) return null;
  const diagramData = JSON.parse(original.diagram_data || "{}");
  const newData = { ...diagramData, name: diagramData.name || original.title };
  return createDiagram(
    newOwnerId || original.owner_id,
    original.title + " (副本)",
    original.database_type,
    newData,
  );
}

export function getShareToken(diagramId) {
  const db = getDb();
  const result = db.exec("SELECT share_token FROM diagrams WHERE id = ?", [diagramId]);
  if (!result.length || !result[0].values.length) return null;
  return result[0].values[0][0];
}

export function generateShareToken(diagramId) {
  const db = getDb();
  const token = nanoid(12);
  db.run("UPDATE diagrams SET share_token = ? WHERE id = ?", [token, diagramId]);
  saveDbToDisk();
  return token;
}

export function revokeShareToken(diagramId) {
  const db = getDb();
  db.run("UPDATE diagrams SET share_token = NULL WHERE id = ?", [diagramId]);
  saveDbToDisk();
}

export function getDiagramByShareToken(token) {
  const db = getDb();
  const result = db.exec("SELECT * FROM diagrams WHERE share_token = ?", [token]);
  if (!result.length || !result[0].values.length) return null;
  const obj = {};
  result[0].columns.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj;
}

export function deleteDiagram(id) {
  const db = getDb();
  db.run("DELETE FROM diagrams WHERE id = ?", [id]);
  saveDbToDisk();
}

export function addCollaborator(diagramId, userId, role = "editor") {
  const db = getDb();
  db.run(
    "INSERT OR IGNORE INTO diagram_collaborators (diagram_id, user_id, role) VALUES (?, ?, ?)",
    [diagramId, userId, role],
  );
  saveDbToDisk();
}

export function removeCollaborator(diagramId, userId) {
  const db = getDb();
  db.run(
    "DELETE FROM diagram_collaborators WHERE diagram_id = ? AND user_id = ? AND role != 'owner'",
    [diagramId, userId],
  );
  saveDbToDisk();
}

export function getCollaborators(diagramId) {
  const db = getDb();
  return rowsToArray(
    db.exec(
      `SELECT u.id, u.username, u.display_name, u.avatar_color, dc.role, dc.joined_at
       FROM diagram_collaborators dc
       JOIN users u ON dc.user_id = u.id
       WHERE dc.diagram_id = ?`,
      [diagramId],
    ),
  );
}

export function getOperations(diagramId, limit = 50) {
  const db = getDb();
  return rowsToArray(
    db.exec(
      `SELECT ol.id, ol.version, ol.operation, ol.created_at,
              u.display_name as user_name
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       WHERE ol.diagram_id = ?
       ORDER BY ol.created_at DESC
       LIMIT ?`,
      [diagramId, limit],
    ),
  );
}
