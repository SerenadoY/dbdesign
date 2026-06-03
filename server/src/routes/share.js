import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getDiagramById,
  getShareToken,
  generateShareToken,
  revokeShareToken,
  getDiagramByShareToken,
} from "../models/Diagram.js";

const router = Router();

router.get("/shared/:token", (req, res) => {
  try {
    const diagram = getDiagramByShareToken(req.params.token);
    if (!diagram) return res.status(404).json({ error: "Share link not found" });
    const data = JSON.parse(diagram.diagram_data || "{}");
    res.json({
      diagram: {
        diagramId: diagram.id,
        database: data.database || diagram.database_type || "mysql",
        name: data.name || diagram.title,
        tables: data.tables || [],
        references: data.references || [],
        notes: data.notes || [],
        areas: data.areas || [],
        enums: data.enums || [],
        types: data.types || [],
        pan: data.pan || { x: 0, y: 0 },
        zoom: data.zoom || 1,
        canWrite: false,
      },
    });
  } catch (err) {
    console.error("Get shared diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.use(authMiddleware);

router.post("/diagrams/:id/share", (req, res) => {
  try {
    const diagram = getDiagramById(req.params.id);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    let token = getShareToken(req.params.id);
    if (!token) {
      token = generateShareToken(req.params.id);
    }
    res.json({ shareToken: token });
  } catch (err) {
    console.error("Generate share token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/diagrams/:id/share", (req, res) => {
  try {
    revokeShareToken(req.params.id);
    res.json({ status: "revoked" });
  } catch (err) {
    console.error("Revoke share token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
