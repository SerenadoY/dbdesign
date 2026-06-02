import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { config } from "./config.js";
import { initDb } from "./db/index.js";
import authRoutes from "./routes/auth.js";
import diagramRoutes from "./routes/diagrams.js";
import userRoutes from "./routes/users.js";
import { setupSocketHandlers } from "./collab/socket.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Support both local (../../client/dist) and Docker (../client/dist) layouts
const clientDist =
  existsSync(resolve(__dirname, "../client/dist"))
    ? resolve(__dirname, "../client/dist")
    : resolve(__dirname, "../../client/dist");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize database, then start server
initDb()
  .then(() => {
    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/diagrams", diagramRoutes);
    app.use("/api/users", userRoutes);

    // Health check
    app.get("/api/health", (req, res) => res.json({ status: "ok" }));

    // WebSocket
    setupSocketHandlers(io);

    // Serve built frontend in production (single-port mode)
    if (existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) return;
        res.sendFile(resolve(clientDist, "index.html"));
      });
    }

    httpServer.listen(config.port, () => {
      console.log(`DBDesign server running on port ${config.port}`);
    });
  })
  .catch((e) => { console.error("Failed to initialize database:", e); process.exit(1); });
