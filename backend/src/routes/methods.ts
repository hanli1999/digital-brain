import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "methods";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.title) input.title = body.title;
  if (body.essence) input.essence = body.essence;
  if (body.status) input.status = body.status;
  if (body.type) input.type = body.type;
  if (body.learnedDate) input.learnedDate = body.learnedDate;
  if (body.storage) input.storage = body.storage;
  if (body.related) input.related = body.related;
  if (body.relatedTools) input.relatedTools = body.relatedTools;
  if (body.relatedMaterials) input.relatedMaterials = body.relatedMaterials;
  if (body.relatedInsights) input.relatedInsights = body.relatedInsights;
  if (body.tags) input.tags = body.tags;

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
  if (body.essence !== undefined) input.essence = body.essence;
  if (body.status !== undefined) input.status = body.status;
  if (body.type !== undefined) input.type = body.type;
  if (body.learnedDate !== undefined) input.learnedDate = body.learnedDate;
  if (body.storage !== undefined) input.storage = body.storage;
  if (body.related !== undefined) input.related = body.related;
  if (body.relatedTools !== undefined) input.relatedTools = body.relatedTools;
  if (body.relatedMaterials !== undefined) input.relatedMaterials = body.relatedMaterials;
  if (body.relatedInsights !== undefined) input.relatedInsights = body.relatedInsights;
  if (body.tags !== undefined) input.tags = body.tags;

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(record);
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export default app;
