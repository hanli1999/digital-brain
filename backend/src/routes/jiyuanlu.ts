import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "jiyuanlu";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.detail) input.detail = body.detail;
  if (body.description) input.description = body.description;
  if (body.status) input.status = body.status;
  if (body.action) input.action = body.action;
  if (body.tags) input.tags = body.tags;
  if (body.relatedMethod) input.relatedMethod = body.relatedMethod;
  if (body.actionLog) input.actionLog = body.actionLog;

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
  if (body.detail !== undefined) input.detail = body.detail;
  if (body.description !== undefined) input.description = body.description;
  if (body.status !== undefined) input.status = body.status;
  if (body.action !== undefined) input.action = body.action;
  if (body.tags !== undefined) input.tags = body.tags;
  if (body.relatedMethod !== undefined) input.relatedMethod = body.relatedMethod;
  if (body.actionLog !== undefined) input.actionLog = body.actionLog;

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
