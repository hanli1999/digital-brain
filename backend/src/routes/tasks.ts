import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tblOyyByZYtZz7dA";

const CN_TO_EN: Record<string, string> = {
  "任务名称": "title",
  "详细描述": "description",
  "任务状态": "status",
  "转化行动": "action",
  "标签": "tags",
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
  if (body.title) fields["任务名称"] = body.title;
  if (body.description) fields["详细描述"] = body.description;
  if (body.status) fields["任务状态"] = body.status;
  if (body.action) fields["转化行动"] = body.action;
  if (body.tags) fields["标签"] = typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags);

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
  if (body.title !== undefined) fields["任务名称"] = body.title;
  if (body.description !== undefined) fields["详细描述"] = body.description;
  if (body.status !== undefined) fields["任务状态"] = body.status;
  if (body.action !== undefined) fields["转化行动"] = body.action;
  if (body.tags !== undefined) fields["标签"] = typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags);

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
