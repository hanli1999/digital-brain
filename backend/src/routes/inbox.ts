import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/feishu.js";
import { toEnglish, toFeishuFields } from "../lib/field-map.js";

const TABLE = "tbl2pG26LdF3c3cX";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  const mapped = await Promise.all(records.map((r) => toEnglish(TABLE, r)));
  return c.json(mapped);
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

  const fields = await toFeishuFields(TABLE, input);
  const record = await createRecord(TABLE, fields);
  if (!record) return c.json({ error: "Failed to create" }, 500);
  return c.json(await toEnglish(TABLE, record), 201);
});

app.get("/:id", async (c) => {
  const record = await getRecord(TABLE, c.req.param("id"));
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(await toEnglish(TABLE, record));
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

  const fields = await toFeishuFields(TABLE, input);
  const record = await updateRecord(TABLE, c.req.param("id"), fields);
  if (!record) return c.json({ error: "Update failed" }, 500);
  return c.json(await toEnglish(TABLE, record));
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

app.post("/:id/route", async (c) => {
  const body = await c.req.json();
  const target = body.routeTarget as string;
  if (!target) return c.json({ error: "Missing routeTarget" }, 400);

  const input: Record<string, unknown> = {
    routeTarget: target,
    status: "routed",
    routedTo: target,
  };

  const fields = await toFeishuFields(TABLE, input);
  const record = await updateRecord(TABLE, c.req.param("id"), fields);
  if (!record) return c.json({ error: "Route failed" }, 500);
  return c.json({ inbox: await toEnglish(TABLE, record), routedId: target, target });
});

export default app;
