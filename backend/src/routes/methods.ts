import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tbllqXDX0MbmUl07";

const CN_TO_EN: Record<string, string> = {
  "方法名称": "title",
  "核心精要": "essence",
  "掌握状态": "status",
  "方法类型": "type",
  "领悟日期": "learnedDate",
  "存放位置": "storage",
  "推荐关联": "related",
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
  if (body.title) fields["方法名称"] = body.title;
  if (body.essence) fields["核心精要"] = body.essence;
  if (body.status) fields["掌握状态"] = body.status;
  if (body.type) fields["方法类型"] = body.type;
  if (body.learnedDate) fields["领悟日期"] = body.learnedDate;
  if (body.storage) fields["存放位置"] = body.storage;
  if (body.related) fields["推荐关联"] = body.related;

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
  if (body.title !== undefined) fields["方法名称"] = body.title;
  if (body.essence !== undefined) fields["核心精要"] = body.essence;
  if (body.status !== undefined) fields["掌握状态"] = body.status;
  if (body.type !== undefined) fields["方法类型"] = body.type;
  if (body.learnedDate !== undefined) fields["领悟日期"] = body.learnedDate;
  if (body.storage !== undefined) fields["存放位置"] = body.storage;
  if (body.related !== undefined) fields["推荐关联"] = body.related;

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
