import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const MODEL_MAP: Record<string, string> = {
  tools: "tool",
  methods: "method",
  library: "document",
  "ai-engine": "aiMechanism",
  resources: "resource",
  tasks: "task",
  files: "fileAsset",
  calendar: "calendarEvent",
  jiyuanlu: "jiyuanlu",
  insight: "insight",
  inbox: "inboxItem",
};

const app = new Hono();

// GET /api/records/batch?ids=id1,id2,id3&module=methods
app.get("/batch", async (c) => {
  const ids = (c.req.query("ids") || "").split(",").filter(Boolean);
  const module = c.req.query("module") || "";
  const modelName = MODEL_MAP[module];
  if (!modelName) return c.json({ error: `Unknown module: ${module}` }, 400);
  if (ids.length === 0) return c.json([]);

  const model = (prisma as any)[modelName];
  if (!model) return c.json({ error: `Model not found: ${modelName}` }, 500);

  const records = await model.findMany({
    where: { id: { in: ids } },
  });

  return c.json(records.map((r: any) => {
    const { userId, user, feishuId, ...rest } = r;
    return { id: rest.id, title: rest.title || rest.name || rest.detail || "(无标题)", module, ...rest };
  }));
});

export default app;
