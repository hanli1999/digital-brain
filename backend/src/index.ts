import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync } from "node:fs";
import { authMiddleware } from "./lib/auth-middleware.js";

import authRoutes from "./routes/auth.js";
import inboxRoutes from "./routes/inbox.js";
import taskRoutes from "./routes/tasks.js";
import toolRoutes from "./routes/tools.js";
import methodRoutes from "./routes/methods.js";
import libraryRoutes from "./routes/library.js";
import resourcesRoutes from "./routes/resources.js";
import fileRoutes from "./routes/files.js";
import calendarRoutes from "./routes/calendar.js";
import aiEngineRoutes from "./routes/ai-engine.js";
import aiRoutes from "./routes/ai.js";
import searchRoutes from "./routes/search.js";
import settingsRoutes from "./routes/settings.js";
import syncRoutes from "./routes/sync.js";
import insightRoutes from "./routes/insight.js";
import webhookRoutes from "./routes/webhook.js";

const app = new Hono();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  "*",
  cors({
    origin: [FRONTEND_URL, "https://digital-brain-delta.vercel.app", "https://frontend-umber-eta-59.vercel.app", /https:\/\/digital-brain-[a-z0-9]+-hanli-s-projects2\.vercel\.app$/, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// 静态文件服务 — uploads
app.use("/uploads/*", serveStatic({ root: "./" }));

// 公开路由（无需认证）
app.route("/api/auth", authRoutes);

app.get("/", (c) => c.json({
  status: "online",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));
app.get("/api/status", (c) => c.json({
  status: "online",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));

// 保护路由（需要 JWT）
app.use("/api/inbox/*", authMiddleware);
app.route("/api/inbox", inboxRoutes);
app.use("/api/tasks/*", authMiddleware);
app.route("/api/tasks", taskRoutes);
app.use("/api/tools/*", authMiddleware);
app.route("/api/tools", toolRoutes);
app.use("/api/methods/*", authMiddleware);
app.route("/api/methods", methodRoutes);
app.use("/api/library/*", authMiddleware);
app.route("/api/library", libraryRoutes);
app.use("/api/resources/*", authMiddleware);
app.route("/api/resources", resourcesRoutes);
app.use("/api/metrics/*", authMiddleware);
app.route("/api/metrics", resourcesRoutes);
app.use("/api/files/*", authMiddleware);
app.route("/api/files", fileRoutes);
app.use("/api/calendar/*", authMiddleware);
app.route("/api/calendar", calendarRoutes);
app.use("/api/ai-engine/*", authMiddleware);
app.route("/api/ai-engine", aiEngineRoutes);
app.use("/api/ai/*", authMiddleware);
app.route("/api/ai", aiRoutes);
app.use("/api/search/*", authMiddleware);
app.route("/api/search", searchRoutes);
app.use("/api/settings/*", authMiddleware);
app.route("/api/settings", settingsRoutes);
app.use("/api/sync/*", authMiddleware);
app.route("/api/sync", syncRoutes);
app.use("/api/insight/*", authMiddleware);
app.route("/api/insight", insightRoutes);
app.use("/api/webhook/*", authMiddleware);
app.route("/api/webhook", webhookRoutes);

// 静态文件服务 — 前端产物（生产模式）
app.use("/assets/*", serveStatic({ root: "../frontend/dist/" }));
app.get("/*", (c) => {
  const html = readFileSync("../frontend/dist/index.html", "utf-8");
  return c.html(html);
});

const port = Number(process.env.PORT) || 3001;
console.log(`Backend running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
