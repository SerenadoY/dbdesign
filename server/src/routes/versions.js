import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  saveSnapshot, getVersions, getSnapshot, restoreSnapshot, deleteSnapshot, getDiagramById, getOperations,
} from "../models/Diagram.js";

const router = Router();

router.use(authMiddleware);

router.get("/:id/versions", (req, res) => {
  try {
    const diagram = getDiagramById(req.params.id);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    const list = getVersions(req.params.id);
    res.json({ versions: list });
  } catch (err) {
    console.error("List versions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/operations", (req, res) => {
  try {
    const diagram = getDiagramById(req.params.id);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    const list = getOperations(req.params.id, parseInt(req.query.limit) || 50);
    res.json({ operations: list });
  } catch (err) {
    console.error("List operations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/versions", (req, res) => {
  try {
    const diagram = getDiagramById(req.params.id);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    const diagramData = JSON.parse(diagram.diagram_data || "{}");
    const { version } = saveSnapshot(req.params.id, req.userId, diagramData, req.body.message);
    res.status(201).json({ version });
  } catch (err) {
    console.error("Save version error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/versions/:version", (req, res) => {
  try {
    const snapshot = getSnapshot(req.params.id, parseInt(req.params.version));
    if (!snapshot) return res.status(404).json({ error: "Version not found" });
    const diagramData = JSON.parse(snapshot.diagram_data || "{}");
    res.json({
      version: {
        id: snapshot.id,
        version: snapshot.version,
        diagramData,
        message: snapshot.message,
        created_at: snapshot.created_at,
        user_name: snapshot.user_name,
      },
    });
  } catch (err) {
    console.error("Get version error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/versions/:version/restore", (req, res) => {
  try {
    const diagramData = restoreSnapshot(req.params.id, parseInt(req.params.version));
    if (!diagramData) return res.status(404).json({ error: "Version not found" });
    res.json({ diagramData });
  } catch (err) {
    console.error("Restore version error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/versions/:version", (req, res) => {
  try {
    const ok = deleteSnapshot(req.params.id, parseInt(req.params.version));
    if (!ok) return res.status(404).json({ error: "Version not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete version error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
