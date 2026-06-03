import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { reverseEngineerPostgres } from "../adapters/postgres.js";
import { reverseEngineerMySQL } from "../adapters/mysql.js";
import { createDiagram } from "../models/Diagram.js";

const router = Router();

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
