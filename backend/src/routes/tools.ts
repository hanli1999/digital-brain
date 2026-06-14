import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "tools";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.name) input.name = body.name;
  if (body.url) {
    input.url = typeof body.url === "string" ? body.url : (body.url as any).link || body.url;
  }
  if (body.category) input.category = body.category;
  if (body.corePower) input.corePower = body.corePower;
  if (body.initScript) input.initScript = body.initScript;
  if (body.rating) input.rating = body.rating;
  if (body.record) input.record = body.record;
  if (body.relatedResource) input.relatedResource = body.relatedResource;

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
  if (body.name !== undefined) input.name = body.name;
  if (body.url !== undefined) {
    input.url = typeof body.url === "string" ? body.url : (body.url as any).link || body.url;
  }
  if (body.category !== undefined) input.category = body.category;
  if (body.corePower !== undefined) input.corePower = body.corePower;
  if (body.initScript !== undefined) input.initScript = body.initScript;
  if (body.rating !== undefined) input.rating = body.rating;
  if (body.record !== undefined) input.record = body.record;
  if (body.relatedResource !== undefined) input.relatedResource = body.relatedResource;

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
