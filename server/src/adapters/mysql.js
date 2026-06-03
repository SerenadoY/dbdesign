import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const TABLE_COLORS = [
  "#175e7a", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ec4899", "#ef4444", "#06b6d4", "#84cc16", "#a855f7",
];

const TYPE_MAP = {
  "int": "INT", "tinyint": "TINYINT", "smallint": "SMALLINT",
  "mediumint": "MEDIUMINT", "bigint": "BIGINT",
  "float": "FLOAT", "double": "DOUBLE", "decimal": "DECIMAL", "numeric": "NUMERIC",
  "char": "CHAR", "varchar": "VARCHAR", "tinytext": "TINYTEXT", "text": "TEXT",
  "mediumtext": "MEDIUMTEXT", "longtext": "LONGTEXT",
  "binary": "BINARY", "varbinary": "VARBINARY", "blob": "BLOB", "tinyblob": "TINYBLOB",
  "mediumblob": "MEDIUMBLOB", "longblob": "LONGBLOB",
  "date": "DATE", "datetime": "DATETIME", "timestamp": "TIMESTAMP", "time": "TIME", "year": "YEAR",
  "enum": "ENUM", "set": "SET",
  "json": "JSON",
  "boolean": "BOOLEAN", "bit": "BIT",
};

function mapType(rawType) {
  const lower = rawType.toLowerCase().replace(/\(.*/, "");
  const match = rawType.match(/^(\w+)\((.+)\)$/);
  if (match && (lower === "enum" || lower === "set")) {
    return `${match[1].toUpperCase()}(${match[2]})`;
  }
  return TYPE_MAP[lower] || TYPE_MAP[lower.replace(/ unsigned$/, "")] || rawType.toUpperCase();
}

function hasUnsigned(rawType) {
  return rawType.toLowerCase().includes("unsigned");
}

function isBoolLike(rawType) {
  const t = rawType.toLowerCase().replace(/\(.*/, "");
  return t === "tinyint" || t === "boolean";
}

function mapDefault(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str === "CURRENT_TIMESTAMP" || str.startsWith("CURRENT_TIMESTAMP")) return str;
  if (str.startsWith("'") && str.endsWith("'")) {
    return str.slice(1, -1);
  }
  return str;
}

export async function reverseEngineerMySQL(connectionConfig) {
  const { host, port, database, user, password } = connectionConfig;

  const connection = await mysql.createConnection({
    host: host || "localhost",
    port: parseInt(port || "3306", 10),
    database,
    user,
    password,
    connectTimeout: 10000,
  });

  try {
    // Get tables
    const [tableRows] = await connection.query(
      `SELECT TABLE_NAME, TABLE_COMMENT
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [database],
    );

    // Get columns
    const [columns] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE,
              IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT,
              EXTRA, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [database],
    );

    // Get primary keys
    const [pks] = await connection.query(
      `SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.KEY_COLUMN_USAGE kcu
         ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
        AND tc.TABLE_NAME = kcu.TABLE_NAME
       WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
         AND tc.TABLE_SCHEMA = ?
       ORDER BY kcu.TABLE_NAME, kcu.ORDINAL_POSITION`,
      [database],
    );

    // Build PK lookup
    const pkMap = {};
    for (const row of pks) {
      if (!pkMap[row.TABLE_NAME]) pkMap[row.TABLE_NAME] = new Set();
      pkMap[row.TABLE_NAME].add(row.COLUMN_NAME);
    }

    // Get foreign keys
    const [fks] = await connection.query(
      `SELECT kcu.CONSTRAINT_NAME,
              kcu.TABLE_NAME AS SOURCE_TABLE,
              kcu.COLUMN_NAME AS SOURCE_COLUMN,
              kcu.REFERENCED_TABLE_NAME AS TARGET_TABLE,
              kcu.REFERENCED_COLUMN_NAME AS TARGET_COLUMN
       FROM information_schema.KEY_COLUMN_USAGE kcu
       WHERE kcu.TABLE_SCHEMA = ?
         AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION`,
      [database],
    );

    // Group columns by table
    const columnsByTable = {};
    for (const row of columns) {
      if (!columnsByTable[row.TABLE_NAME]) columnsByTable[row.TABLE_NAME] = [];
      columnsByTable[row.TABLE_NAME].push(row);
    }

    // Build tables
    let colorIdx = 0;
    const tables = [];
    const tableIdByName = {};

    for (const table of tableRows) {
      const tableId = nanoid();
      tableIdByName[table.TABLE_NAME] = tableId;

      const cols = columnsByTable[table.TABLE_NAME] || [];
      const pkSet = pkMap[table.TABLE_NAME] || new Set();

      const fields = cols.map((col) => {
        const isPk = pkSet.has(col.COLUMN_NAME);
        const rawType = col.COLUMN_TYPE;
        const isAutoIncrement = (col.EXTRA || "").toLowerCase().includes("auto_increment");

        return {
          id: nanoid(),
          name: col.COLUMN_NAME,
          type: mapType(rawType),
          primary: isPk,
          unique: false,
          unsigned: hasUnsigned(rawType) && !isBoolLike(rawType),
          notNull: col.IS_NULLABLE === "NO",
          increment: isAutoIncrement,
          default: mapDefault(col.COLUMN_DEFAULT),
          check: "",
          comment: col.COLUMN_COMMENT || "",
        };
      });

      tables.push({
        id: tableId,
        name: table.TABLE_NAME,
        x: (colorIdx % 2 === 0 ? -1 : 1) * 350 + Math.floor(colorIdx / 2) % 2 * 100,
        y: Math.floor(colorIdx / 2) * 300,
        locked: false,
        fields,
        comment: table.TABLE_COMMENT || "",
        indices: [],
        color: TABLE_COLORS[colorIdx % TABLE_COLORS.length],
        collapsed: false,
      });
      colorIdx++;
    }

    // Build references
    const references = [];
    for (const fk of fks) {
      const srcTableId = tableIdByName[fk.SOURCE_TABLE];
      const tgtTableId = tableIdByName[fk.TARGET_TABLE];
      if (!srcTableId || !tgtTableId) continue;

      const srcTable = tables.find((t) => t.id === srcTableId);
      const tgtTable = tables.find((t) => t.id === tgtTableId);
      if (!srcTable || !tgtTable) continue;

      const srcField = srcTable.fields.find((f) => f.name === fk.SOURCE_COLUMN);
      const tgtField = tgtTable.fields.find((f) => f.name === fk.TARGET_COLUMN);
      if (!srcField || !tgtField) continue;

      references.push({
        id: nanoid(),
        name: fk.CONSTRAINT_NAME,
        ends: [
          { tableId: srcTableId, fieldId: srcField.id },
          { tableId: tgtTableId, fieldId: tgtField.id },
        ],
        color: "#eab308",
      });
    }

    return {
      database: "mysql",
      name: database,
      tables,
      references,
      notes: [],
      areas: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
      gistId: "",
      loadedFromGistId: "",
    };
  } finally {
    try { await connection.end(); } catch { /* ignore */ }
  }
}
