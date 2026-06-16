import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { roomManager } from "./room.js";
import { mergeDelta } from "./engine.js";
import { updateDiagram, getDiagramById } from "../models/Diagram.js";
import { getDb, saveDbToDisk } from "../db/index.js";

function getEntityName(delta, diagramData) {
  if (delta.action === "create" && delta.data?.[0]) {
    if (delta.target === "table" || delta.target === "relationship" || delta.target === "area") {
      return delta.data[0].name || "";
    }
    return "";
  }
  if (delta.target === "table") {
    const table = (diagramData.tables || []).find(t => t.id === delta.entityId);
    return table?.name || "";
  }
  if (delta.target === "relationship") {
    const rel = (diagramData.relationships || []).find(r => r.id === delta.entityId);
    return rel?.name || "";
  }
  if (delta.target === "area") {
    const area = (diagramData.subjectAreas || []).find(a => a.id === delta.entityId);
    return area?.name || "";
  }
  return "";
}

const socketRateLimitStore = new Map();
const SOCKET_RATE_LIMIT_MAX = 5;
const SOCKET_RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function socketRateLimiter(socket, next) {
  const ip = socket.handshake.address;
  const now = Date.now();
  const record = socketRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    socketRateLimitStore.set(ip, { count: 1, resetTime: now + SOCKET_RATE_LIMIT_WINDOW });
    return next();
  }

  record.count++;
  if (record.count > SOCKET_RATE_LIMIT_MAX) {
    return next(new Error("请求过于频繁，请15分钟后再试"));
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of socketRateLimitStore) {
    if (now > record.resetTime) socketRateLimitStore.delete(ip);
  }
}, SOCKET_RATE_LIMIT_WINDOW);

export function setupSocketHandlers(io) {
  io.use(socketRateLimiter);

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

      // Log operation
      const db = getDb();
      const entityName = getEntityName(delta, diagramData);
      db.run(
        "INSERT INTO operation_logs (diagram_id, user_id, operation, version, entity_name) VALUES (?, ?, ?, ?, ?)",
        [currentDiagramId, socket.userId, JSON.stringify(delta), newVersion, entityName],
      );
      saveDbToDisk();

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
