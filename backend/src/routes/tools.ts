import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tbl5r4qZHGnFxUSC";

const CN_TO_EN: Record<string, string> = {
  "工具名称": "name",
  "调用链接": "url",
  "工具类型": "category",
  "核心神通": "corePower",
  "祭炼口诀": "initScript",
  "威力评级": "rating",
  "法器记录": "record",
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
  if (body.name) fields["工具名称"] = body.name;
  if (body.url) fields["调用链接"] = body.url;
  if (body.category) fields["工具类型"] = body.category;
  if (body.corePower) fields["核心神通"] = body.corePower;
  if (body.initScript) fields["祭炼口诀"] = body.initScript;
  if (body.rating) fields["威力评级"] = body.rating;
  if (body.record) fields["法器记录"] = body.record;

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
  if (body.name !== undefined) fields["工具名称"] = body.name;
  if (body.url !== undefined) fields["调用链接"] = body.url;
  if (body.category !== undefined) fields["工具类型"] = body.category;
  if (body.corePower !== undefined) fields["核心神通"] = body.corePower;
  if (body.initScript !== undefined) fields["祭炼口诀"] = body.initScript;
  if (body.rating !== undefined) fields["威力评级"] = body.rating;
  if (body.record !== undefined) fields["法器记录"] = body.record;

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
