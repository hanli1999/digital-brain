import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";
import { ROUTE_TARGETS, resolveTarget } from "../lib/route-targets.js";

const TABLE = "inbox";

const app = new Hono();

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

  const record = await createRecord(TABLE, input);
  if (!record) return c.json({ error: "Failed to create" }, 500);
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

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Update failed" }, 500);
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
