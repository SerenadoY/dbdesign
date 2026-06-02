import pg from "pg";
import { nanoid } from "nanoid";

const TABLE_COLORS = [
  "#175e7a", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ec4899", "#ef4444", "#06b6d4", "#84cc16", "#a855f7",
];

const TYPE_MAP = {
  "integer": "INTEGER", "int": "INTEGER", "int4": "INTEGER",
  "bigint": "BIGINT", "int8": "BIGINT", "smallint": "SMALLINT", "int2": "SMALLINT",
  "boolean": "BOOLEAN", "bool": "BOOLEAN",
  "text": "TEXT",
  "character varying": "VARCHAR", "varchar": "VARCHAR", "character": "CHAR",
  "numeric": "NUMERIC", "decimal": "DECIMAL", "real": "REAL", "double precision": "DOUBLE PRECISION", "float8": "DOUBLE PRECISION", "float4": "REAL",
  "date": "DATE", "timestamp": "TIMESTAMP", "timestamptz": "TIMESTAMPTZ", "time": "TIME",
  "uuid": "UUID",
  "json": "JSON", "jsonb": "JSONB",
  "bytea": "BYTEA",
};

function mapType(pgType) {
  const lower = pgType.toLowerCase();
  // Check for parameterized types like varchar(100)
  const base = lower.replace(/\(.*/, "");
  return TYPE_MAP[base] || pgType.toUpperCase();
}

function mapDefault(col) {
  let val = col.column_default || "";
  // Remove type cast ::character varying etc
  val = val.replace(/::[\w\s]+$/g, "").trim();
  // Unquote escaped strings: 'something'::type -> something
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1);
  }
  return val;
}

export async function reverseEngineerPostgres(connectionConfig) {
  const { host, port, database, user, password, schema } = connectionConfig;

  const client = new pg.Client({
    host: host || "localhost",
    port: parseInt(port || "5432", 10),
    database,
    user,
    password,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();

    const targetSchema = schema || "public";

    // Get tables
    const tableRes = await client.query(
      `SELECT table_name, obj_description(c.oid) as comment
       FROM information_schema.tables t
       LEFT JOIN pg_catalog.pg_class c ON c.relname = t.table_name AND c.relnamespace = (
         SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = t.table_schema
       )
       WHERE t.table_schema = $1 AND t.table_type = 'BASE TABLE'
       ORDER BY t.table_name`,
      [targetSchema],
    );

    // Get columns
    const colRes = await client.query(
      `SELECT
        c.table_name, c.column_name, c.data_type, c.is_nullable,
        c.column_default, c.character_maximum_length,
        COALESCE(pg_catalog.col_description(pc.oid, c.ordinal_position::int), '') as comment
       FROM information_schema.columns c
       JOIN pg_catalog.pg_class pc ON pc.relname = c.table_name
       JOIN pg_catalog.pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = c.table_schema
       WHERE c.table_schema = $1
       ORDER BY c.table_name, c.ordinal_position`,
      [targetSchema],
    );

    // Get primary keys
    const pkRes = await client.query(
      `SELECT
        kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON
         tc.constraint_catalog = kcu.constraint_catalog AND
         tc.constraint_schema = kcu.constraint_schema AND
         tc.constraint_name = kcu.constraint_name
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = $1
       ORDER BY kcu.table_name, kcu.ordinal_position`,
      [targetSchema],
    );

    // Build PK lookup
    const pkMap = {};
    for (const row of pkRes.rows) {
      if (!pkMap[row.table_name]) pkMap[row.table_name] = new Set();
      pkMap[row.table_name].add(row.column_name);
    }

    // Get foreign keys
    const fkRes = await client.query(
      `SELECT
        tc.constraint_name,
        kcu.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON
         tc.constraint_catalog = kcu.constraint_catalog AND
         tc.constraint_schema = kcu.constraint_schema AND
         tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON
         tc.constraint_catalog = ccu.constraint_catalog AND
         tc.constraint_schema = ccu.constraint_schema AND
         tc.constraint_name = ccu.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1
       ORDER BY tc.constraint_name, kcu.ordinal_position`,
      [targetSchema],
    );

    // Group columns by table
    const columnsByTable = {};
    for (const row of colRes.rows) {
      if (!columnsByTable[row.table_name]) columnsByTable[row.table_name] = [];
      columnsByTable[row.table_name].push(row);
    }

    // Build tables
    let colorIdx = 0;
    const tables = [];
    const tableIdByName = {};

    for (const table of tableRes.rows) {
      const tableId = nanoid();
      tableIdByName[table.table_name] = tableId;

      const cols = columnsByTable[table.table_name] || [];
      const pkSet = pkMap[table.table_name] || new Set();

      const fields = cols.map((col) => {
        const isPk = pkSet.has(col.column_name);
        let pgType = col.data_type;
        if (col.character_maximum_length && (pgType === "character varying" || pgType === "character")) {
          pgType = pgType === "character" ? `CHAR(${col.character_maximum_length})` : `VARCHAR(${col.character_maximum_length})`;
        }
        return {
          id: nanoid(),
          name: col.column_name,
          type: mapType(pgType),
          primary: isPk,
          unique: false,
          unsigned: false,
          notNull: col.is_nullable === "NO",
          increment: false,
          default: mapDefault(col),
          check: "",
          comment: col.comment || "",
        };
      });

      tables.push({
        id: tableId,
        name: table.table_name,
        x: (colorIdx % 2 === 0 ? -1 : 1) * 350 + Math.floor(colorIdx / 2) % 2 * 100,
        y: Math.floor(colorIdx / 2) * 300,
        locked: false,
        fields,
        comment: table.comment || "",
        indices: [],
        color: TABLE_COLORS[colorIdx % TABLE_COLORS.length],
        collapsed: false,
      });
      colorIdx++;
    }

    // Build references
    const references = [];
    for (const fk of fkRes.rows) {
      const srcTableId = tableIdByName[fk.source_table];
      const tgtTableId = tableIdByName[fk.target_table];
      if (!srcTableId || !tgtTableId) continue;

      const srcTable = tables.find((t) => t.id === srcTableId);
      const tgtTable = tables.find((t) => t.id === tgtTableId);
      if (!srcTable || !tgtTable) continue;

      const srcField = srcTable.fields.find((f) => f.name === fk.source_column);
      const tgtField = tgtTable.fields.find((f) => f.name === fk.target_column);
      if (!srcField || !tgtField) continue;

      references.push({
        id: nanoid(),
        name: fk.constraint_name,
        ends: [
          { tableId: srcTableId, fieldId: srcField.id },
          { tableId: tgtTableId, fieldId: tgtField.id },
        ],
        color: "#eab308",
      });
    }

    return {
      database: "postgresql",
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
    try { await client.end(); } catch { /* ignore */ }
  }
}
