import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { reverseEngineerPostgres } from "../adapters/postgres.js";
import { createDiagram } from "../models/Diagram.js";

const router = Router();

router.post("/reverse", authMiddleware, async (req, res) => {
  try {
    const { host, port, database, user, password, schema } = req.body;
    if (!database || !user) {
      return res.status(400).json({ error: "database and user are required" });
    }

    const diagramData = await reverseEngineerPostgres({
      host, port, password, schema,
      database,
      user,
    });

    const diagram = createDiagram(
      req.userId,
      `${database} 数据库逆向`,
      "postgresql",
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
