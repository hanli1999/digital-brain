import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/feishu.js";
import { toEnglish, toFeishuFields } from "../lib/field-map.js";

const TABLE = "tbl6WHGWD9DKLuJ5";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  const mapped = await Promise.all(records.map((r) => toEnglish(TABLE, r)));
  return c.json(mapped);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.name) input.name = body.name;
  // Feishu URL 字段需要 {link, text} 格式
  if (body.url) {
    input.url = typeof body.url === "string" ? { link: body.url, text: body.url } : body.url;
  }
  if (body.type) input.type = body.type;
  if (body.stock !== undefined) input.stock = body.stock;
  if (body.status) input.status = body.status;
  if (body.detail) input.detail = body.detail;

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
  if (body.name !== undefined) input.name = body.name;
  // Feishu URL 字段需要 {link, text} 格式
  if (body.url !== undefined) {
    input.url = typeof body.url === "string" ? { link: body.url, text: body.url } : body.url;
  }
  if (body.type !== undefined) input.type = body.type;
  if (body.stock !== undefined) input.stock = body.stock;
  if (body.status !== undefined) input.status = body.status;
  if (body.detail !== undefined) input.detail = body.detail;

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
