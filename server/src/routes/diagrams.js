import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getDiagramsByUser, getTrashedDiagrams, getDiagramById, createDiagram,
  updateDiagram, deleteDiagram, forceDeleteDiagram, restoreDiagram, copyDiagram, addCollaborator,
  removeCollaborator, getCollaborators, updateCollaboratorRole,
} from "../models/Diagram.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  try {
    const diagrams = getDiagramsByUser(req.userId);
    res.json({ diagrams });
  } catch (err) {
    console.error("List diagrams error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", (req, res) => {
  try {
    const { title, databaseType, diagramData } = req.body;
    const diagram = createDiagram(req.userId, title, databaseType, diagramData);
    res.status(201).json({ diagram });
  } catch (err) {
    console.error("Create diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const diagram = getDiagramById(req.params.id);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
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
        gistId: data.gistId || "",
        loadedFromGistId: data.loadedFromGistId || "",
        canWrite: true,
      },
    });
  } catch (err) {
    console.error("Get diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { title, databaseType } = req.body;
    const diagram = updateDiagram(req.params.id, { title, databaseType });
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    res.json({ diagram });
  } catch (err) {
    console.error("Update diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/data", (req, res) => {
  try {
    const { diagramData } = req.body;
    const diagram = updateDiagram(req.params.id, { diagramData });
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    res.json({ status: "saved" });
  } catch (err) {
    console.error("Save diagram data error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/copy", (req, res) => {
  try {
    const diagram = copyDiagram(req.params.id, req.userId);
    if (!diagram) return res.status(404).json({ error: "Diagram not found" });
    res.status(201).json({ diagram });
  } catch (err) {
    console.error("Copy diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    deleteDiagram(req.params.id);
    res.json({ status: "deleted" });
  } catch (err) {
    console.error("Delete diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trash", (req, res) => {
  try {
    const list = getTrashedDiagrams(req.userId);
    res.json({ diagrams: list });
  } catch (err) {
    console.error("List trash error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/restore", (req, res) => {
  try {
    restoreDiagram(req.params.id);
    res.json({ status: "restored" });
  } catch (err) {
    console.error("Restore diagram error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/force", (req, res) => {
  try {
    forceDeleteDiagram(req.params.id);
    res.json({ status: "deleted" });
  } catch (err) {
    console.error("Force delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/collaborators", (req, res) => {
  try {
    const list = getCollaborators(req.params.id);
    res.json({ collaborators: list });
  } catch (err) {
    console.error("Get collaborators error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/collaborators", (req, res) => {
  try {
    const { userId, role } = req.body;
    addCollaborator(req.params.id, userId, role);
    res.json({ status: "added" });
  } catch (err) {
    console.error("Add collaborator error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/collaborators/:userId", (req, res) => {
  try {
    removeCollaborator(req.params.id, parseInt(req.params.userId));
    res.json({ status: "removed" });
  } catch (err) {
    console.error("Remove collaborator error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/collaborators/:userId", (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'editor' or 'viewer'" });
    }
    updateCollaboratorRole(req.params.id, parseInt(req.params.userId), role);
    res.json({ status: "updated" });
  } catch (err) {
    console.error("Update collaborator role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
