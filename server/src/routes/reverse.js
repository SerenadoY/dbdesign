import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { reverseEngineerPostgres } from "../adapters/postgres.js";
import { reverseEngineerMySQL } from "../adapters/mysql.js";
import { createDiagram } from "../models/Diagram.js";

const router = Router();

function createTestConnection(dbType) {
  return async (params) => {
    if (dbType === "mysql") {
      const mysql = (await import("mysql2/promise")).default;
      const conn = await mysql.createConnection({
        host: params.host, port: parseInt(params.port), database: params.database,
        user: params.user, password: params.password, connectTimeout: 5000,
      });
      await conn.ping();
      await conn.end();
    } else if (dbType === "postgresql") {
      const pg = (await import("pg")).default;
      const client = new pg.Client({
        host: params.host, port: parseInt(params.port), database: params.database,
        user: params.user, password: params.password, connectionTimeoutMillis: 5000,
      });
      await client.connect();
      await client.end();
    }
  };
}

router.post("/reverse/test", authMiddleware, async (req, res) => {
  try {
    const { dbType, host, port, database, user, password } = req.body;
    if (!database || !user) {
      return res.status(400).json({ error: "数据库名和用户名不能为空" });
    }
    const testFn = createTestConnection(dbType);
    await testFn({ host, port, database, user, password });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message || "连接失败" });
  }
});

router.post("/reverse", authMiddleware, async (req, res) => {
  try {
    const { dbType, host, port, database, user, password, schema } = req.body;
    if (!database || !user) {
      return res.status(400).json({ error: "database and user are required" });
    }

    let diagramData;
    switch (dbType) {
      case "mysql":
        diagramData = await reverseEngineerMySQL({ host, port, database, user, password });
        break;
      case "postgresql":
        diagramData = await reverseEngineerPostgres({ host, port, database, user, password, schema });
        break;
      default:
        return res.status(400).json({ error: "Unsupported database type. Supported: mysql, postgresql" });
    }

    const diagram = createDiagram(
      req.userId,
      `${database} 数据库逆向`,
      dbType,
      diagramData,
    );

    res.json({ diagram, data: diagramData });
  } catch (err) {
    console.error("Reverse engineering error:", err);
    res.status(500).json({
      error: err.message || "Reverse engineering failed",
    });
  }
});

export default router;
