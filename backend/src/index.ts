import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import inboxRoutes from "./routes/inbox.js";
import taskRoutes from "./routes/tasks.js";
import toolRoutes from "./routes/tools.js";
import methodRoutes from "./routes/methods.js";
import libraryRoutes from "./routes/library.js";
import fileRoutes from "./routes/files.js";
import calendarRoutes from "./routes/calendar.js";
import metricRoutes from "./routes/metrics.js";
import aiEngineRoutes from "./routes/ai-engine.js";
import aiRoutes from "./routes/ai.js";
import searchRoutes from "./routes/search.js";
import settingsRoutes from "./routes/settings.js";
import syncRoutes from "./routes/sync.js";
import webhookRoutes from "./routes/webhook.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.route("/api/inbox", inboxRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/tools", toolRoutes);
app.route("/api/methods", methodRoutes);
app.route("/api/library", libraryRoutes);
app.route("/api/files", fileRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/metrics", metricRoutes);
app.route("/api/ai-engine", aiEngineRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/webhook", webhookRoutes);

const port = Number(process.env.PORT) || 3001;
console.log(`Backend running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
