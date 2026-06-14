import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";
import { ROUTE_TARGETS, resolveTarget } from "../lib/route-targets.js";
import { parseTextWithDeepSeek } from "../lib/parse-prompt.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";

const TABLE = "inbox";
const UPLOADS_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const app = new Hono();

async function autoParseInboxItem(id: string, title: string, content: string) {
  const text = [title, content].filter(Boolean).join("\n");
  if (!text.trim()) return;

  const card = await parseTextWithDeepSeek(text);
  if (!card) return;

  await updateRecord(TABLE, id, {
    aiSummary: card.abstract || "",
    routeTarget: card.routeTarget || null,
    tags: JSON.stringify(card.tags || []),
    mood: card.mood || "",
  });
}

app.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) return c.json({ error: "No file provided" }, 400);
    if (file.size > MAX_FILE_SIZE) return c.json({ error: "File too large (max 10MB)" }, 400);

    await mkdir(UPLOADS_DIR, { recursive: true });

    const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
    const basename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filepath = join(UPLOADS_DIR, basename);

    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buf);

    const url = `/uploads/${basename}`;
    return c.json({ url, filename: file.name, size: file.size, mimeType: file.type || "application/octet-stream" }, 201);
  } catch (err) {
    console.error("[inbox.upload]", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.title) input.title = body.title;
  if (body.content) input.content = body.content;
  if (body.status) input.status = body.status;
  if (body.category) input.category = body.category;
  if (body.tags) input.tags = body.tags;
  if (body.source) input.source = body.source;
  if (body.mood) input.mood = body.mood;
  if (body.routeTarget) input.routeTarget = body.routeTarget;
  if (body.routedTo) input.routedTo = body.routedTo;
  if (body.sourceUrl) input.sourceUrl = body.sourceUrl;
  if (body.aiSummary) input.aiSummary = body.aiSummary;
  if (body.collectedAt) input.collectedAt = body.collectedAt;
  if (body.imageUrls) input.imageUrls = body.imageUrls;

  const record = await createRecord(TABLE, input);
  if (!record) return c.json({ error: "Failed to create" }, 500);

  // Fire-and-forget AI auto-parse (like Feishu's auto-computed fields)
  if (!input.aiSummary && (input.title || input.content)) {
    void autoParseInboxItem(record.id, String(input.title || ""), String(input.content || ""));
  }

  return c.json(record, 201);
});

app.get("/:id", async (c) => {
  const record = await getRecord(TABLE, c.req.param("id"));
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(record);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.title !== undefined) input.title = body.title;
  if (body.content !== undefined) input.content = body.content;
  if (body.status !== undefined) input.status = body.status;
  if (body.category !== undefined) input.category = body.category;
  if (body.tags !== undefined) input.tags = body.tags;
  if (body.source !== undefined) input.source = body.source;
  if (body.mood !== undefined) input.mood = body.mood;
  if (body.routeTarget !== undefined) input.routeTarget = body.routeTarget;
  if (body.routedTo !== undefined) input.routedTo = body.routedTo;
  if (body.sourceUrl !== undefined) input.sourceUrl = body.sourceUrl;
  if (body.aiSummary !== undefined) input.aiSummary = body.aiSummary;
  if (body.collectedAt !== undefined) input.collectedAt = body.collectedAt;
  if (body.imageUrls !== undefined) input.imageUrls = body.imageUrls;

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(record);
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

app.post("/:id/route", async (c) => {
  const body = await c.req.json();
  const rawTarget = body.routeTarget as string;
  if (!rawTarget) return c.json({ error: "Missing routeTarget" }, 400);

  const targetKey = resolveTarget(rawTarget) || rawTarget;
  const cfg = ROUTE_TARGETS[targetKey];
  if (!cfg) return c.json({ error: `Unknown target: ${targetKey}` }, 400);

  const inboxRecord = await getRecord(TABLE, c.req.param("id"));
  if (!inboxRecord) return c.json({ error: "Inbox record not found" }, 404);
  const inbox = inboxRecord as Record<string, unknown>;

  // Build target fields from fieldMap
  const targetFields: Record<string, unknown> = {};
  for (const [inboxField, targetField] of Object.entries(cfg.fieldMap)) {
    const v = inbox[inboxField];
    if (v !== undefined && v !== null && v !== "") {
      targetFields[targetField] = v;
    }
  }
  if (Object.keys(targetFields).length === 0) {
    targetFields["title"] = String(inbox.title || "未命名");
  }
  if (inbox.tags) targetFields["tags"] = String(inbox.tags);

  const targetRecord = await createRecord(cfg.dbTable, targetFields);
  if (!targetRecord) return c.json({ error: "Failed to create target record" }, 500);

  // Update inbox status
  const updated = await updateRecord(TABLE, c.req.param("id"), {
    routeTarget: rawTarget,
    status: "已炼化",
    routedTo: targetRecord.id || cfg.label,
  });

  return c.json({
    inbox: updated,
    routedId: targetRecord.id,
    target: targetKey,
    targetLabel: cfg.label,
  });
});

export default app;
