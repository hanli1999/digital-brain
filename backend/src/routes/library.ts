import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "library";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.title) input.title = body.title;
  if (body.author) input.author = body.author;
  if (body.url) {
    input.url = typeof body.url === "string" ? body.url : (body.url as any).link || body.url;
  }
  if (body.abstract) input.abstract = body.abstract;
  if (body.keywords) input.keywords = body.keywords;
  if (body.type) input.type = body.type;
  if (body.status) input.status = body.status;
  if (body.importance !== undefined) input.importance = body.importance;
  if (body.publishedAt) input.publishedAt = body.publishedAt;
  if (body.snippet) input.snippet = body.snippet;
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
  if (body.author !== undefined) input.author = body.author;
  if (body.url !== undefined) {
    input.url = typeof body.url === "string" ? body.url : (body.url as any).link || body.url;
  }
  if (body.abstract !== undefined) input.abstract = body.abstract;
  if (body.keywords !== undefined) input.keywords = body.keywords;
  if (body.type !== undefined) input.type = body.type;
  if (body.status !== undefined) input.status = body.status;
  if (body.importance !== undefined) input.importance = body.importance;
  if (body.publishedAt !== undefined) input.publishedAt = body.publishedAt;
  if (body.snippet !== undefined) input.snippet = body.snippet;
  if (body.tags !== undefined) input.tags = body.tags;

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Update failed" }, 500);
  return c.json(record);
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

export default app;
