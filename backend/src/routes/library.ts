import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/feishu.js";
import { toEnglish, toFeishuFields } from "../lib/field-map.js";

const TABLE = "tblfsL2sxubcpw0i";

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
  if (body.author) input.author = body.author;
  if (body.url) input.url = body.url;
  if (body.abstract) input.abstract = body.abstract;
  if (body.keywords) input.keywords = typeof body.keywords === "string" ? JSON.parse(body.keywords) : body.keywords;
  if (body.type) input.type = body.type;
  if (body.status) input.status = body.status;
  if (body.importance !== undefined) input.importance = body.importance;
  if (body.publishedAt) input.publishedAt = body.publishedAt;
  if (body.snippet) input.snippet = body.snippet;

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
  if (body.author !== undefined) input.author = body.author;
  if (body.url !== undefined) input.url = body.url;
  if (body.abstract !== undefined) input.abstract = body.abstract;
  if (body.keywords !== undefined) input.keywords = typeof body.keywords === "string" ? JSON.parse(body.keywords) : body.keywords;
  if (body.type !== undefined) input.type = body.type;
  if (body.status !== undefined) input.status = body.status;
  if (body.importance !== undefined) input.importance = body.importance;
  if (body.publishedAt !== undefined) input.publishedAt = body.publishedAt;
  if (body.snippet !== undefined) input.snippet = body.snippet;

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

export default app;
