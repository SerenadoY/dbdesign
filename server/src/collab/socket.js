import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { roomManager } from "./room.js";
import { mergeDelta } from "./engine.js";
import { updateDiagram, getDiagramById } from "../models/Diagram.js";

export function setupSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    let currentDiagramId = null;

    socket.on("join-room", async ({ diagramId }) => {
      socket.join(diagramId);
      currentDiagramId = diagramId;

      const room = roomManager.addUser(diagramId, socket.id, {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
      });

      const diagram = getDiagramById(diagramId);
      let diagramData = {};
      if (diagram) {
        try { diagramData = JSON.parse(diagram.diagram_data || "{}"); } catch (e) { diagramData = {}; }
      }

      socket.emit("full-state", {
        diagramData,
        version: roomManager.getVersion(diagramId),
        users: roomManager.getUsers(diagramId),
      });

      socket.to(diagramId).emit("user-joined", {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
        users: roomManager.getUsers(diagramId),
      });
    });

    socket.on("delta", async ({ delta, version }) => {
      if (!currentDiagramId) return;

      const diagram = getDiagramById(currentDiagramId);
      if (!diagram) return;

      let diagramData = {};
      try { diagramData = JSON.parse(diagram.diagram_data || "{}"); } catch (e) { diagramData = {}; }

      const newData = mergeDelta(diagramData, delta);

      updateDiagram(currentDiagramId, { diagramData: newData });

      const newVersion = roomManager.incrementVersion(currentDiagramId);

      socket.to(currentDiagramId).emit("delta", {
        delta,
        version: newVersion,
        userId: socket.userId,
      });
    });

    socket.on("leave-room", ({ diagramId }) => {
      if (currentDiagramId === diagramId) {
        const room = roomManager.removeUser(diagramId, socket.id);
        socket.leave(diagramId);
        currentDiagramId = null;
        if (room) {
          io.to(diagramId).emit("user-left", {
            userId: socket.userId,
            socketId: socket.id,
            users: roomManager.getUsers(diagramId),
          });
        }
      }
    });

    socket.on("awareness", (data) => {
      if (!currentDiagramId) return;
      socket.to(currentDiagramId).emit("awareness", {
        ...data,
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
      });
    });

    socket.on("disconnect", () => {
      if (currentDiagramId) {
        const room = roomManager.removeUser(currentDiagramId, socket.id);
        if (room) {
          io.to(currentDiagramId).emit("user-left", {
            userId: socket.userId,
            socketId: socket.id,
            users: roomManager.getUsers(currentDiagramId),
          });
        }
      }
    });
  });
}
