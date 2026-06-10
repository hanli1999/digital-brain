import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tbl6WHGWD9DKLuJ5";

const CN_TO_EN: Record<string, string> = {
  "资源名称": "name",
  "获取链接": "url",
  "资源类型": "type",
  "当前存量": "stock",
  "资源状态": "status",
  "资源详情": "detail",
  "创建时间": "createdAt",
};

function toFrontend(r: FeishuRecord) {
  const result: Record<string, unknown> = { id: r.record_id };
  for (const [key, value] of Object.entries(r.fields)) {
    result[CN_TO_EN[key] || key] = value;
  }
  return result;
}

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records.map(toFrontend));
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const fields: Record<string, unknown> = {};
  if (body.name) fields["资源名称"] = body.name;
  if (body.url) fields["获取链接"] = body.url;
  if (body.type) fields["资源类型"] = body.type;
  if (body.stock !== undefined) fields["当前存量"] = body.stock;
  if (body.status) fields["资源状态"] = body.status;
  if (body.detail) fields["资源详情"] = body.detail;

  const record = await createRecord(TABLE, fields);
  if (!record) return c.json({ error: "Failed to create" }, 500);
  return c.json(toFrontend(record), 201);
});

app.get("/:id", async (c) => {
  const record = await getRecord(TABLE, c.req.param("id"));
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(toFrontend(record));
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const fields: Record<string, unknown> = {};
  if (body.name !== undefined) fields["资源名称"] = body.name;
  if (body.url !== undefined) fields["获取链接"] = body.url;
  if (body.type !== undefined) fields["资源类型"] = body.type;
  if (body.stock !== undefined) fields["当前存量"] = body.stock;
  if (body.status !== undefined) fields["资源状态"] = body.status;
  if (body.detail !== undefined) fields["资源详情"] = body.detail;

  const record = await updateRecord(TABLE, c.req.param("id"), fields);
  if (!record) return c.json({ error: "Update failed" }, 500);
  return c.json(toFrontend(record));
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

export default app;
