import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tbl2pG26LdF3c3cX";

const CN_TO_EN: Record<string, string> = {
  "收集内容": "title",
  "附件识别结果": "content",
  "处理状态": "status",
  "初步分类": "category",
  "核心词": "tags",
  "来源": "source",
  "情绪色": "mood",
  "归入建议": "routeTarget",
  "归位去处": "routedTo",
  "来源(1)": "sourceUrl",
  "炼化结果": "aiSummary",
  "收集时间": "collectedAt",
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
  if (body.title) fields["收集内容"] = body.title;
  if (body.content) fields["附件识别结果"] = body.content;
  if (body.status) fields["处理状态"] = body.status;
  if (body.category) fields["初步分类"] = body.category;
  if (body.tags) fields["核心词"] = body.tags;
  if (body.source) fields["来源"] = body.source;
  if (body.mood) fields["情绪色"] = body.mood;
  if (body.routeTarget) fields["归入建议"] = body.routeTarget;
  if (body.routedTo) fields["归位去处"] = body.routedTo;
  if (body.sourceUrl) fields["来源(1)"] = body.sourceUrl;
  if (body.aiSummary) fields["炼化结果"] = body.aiSummary;
  if (body.collectedAt) fields["收集时间"] = body.collectedAt;

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
  if (body.title !== undefined) fields["收集内容"] = body.title;
  if (body.content !== undefined) fields["附件识别结果"] = body.content;
  if (body.status !== undefined) fields["处理状态"] = body.status;
  if (body.category !== undefined) fields["初步分类"] = body.category;
  if (body.tags !== undefined) fields["核心词"] = body.tags;
  if (body.source !== undefined) fields["来源"] = body.source;
  if (body.mood !== undefined) fields["情绪色"] = body.mood;
  if (body.routeTarget !== undefined) fields["归入建议"] = body.routeTarget;
  if (body.routedTo !== undefined) fields["归位去处"] = body.routedTo;
  if (body.sourceUrl !== undefined) fields["来源(1)"] = body.sourceUrl;
  if (body.aiSummary !== undefined) fields["炼化结果"] = body.aiSummary;
  if (body.collectedAt !== undefined) fields["收集时间"] = body.collectedAt;

  const record = await updateRecord(TABLE, c.req.param("id"), fields);
  if (!record) return c.json({ error: "Update failed" }, 500);
  return c.json(toFrontend(record));
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

app.post("/:id/route", async (c) => {
  const body = await c.req.json();
  const target = body.routeTarget as string;
  if (!target) return c.json({ error: "Missing routeTarget" }, 400);

  const fields: Record<string, unknown> = {
    "归入建议": target,
    "处理状态": "routed",
    "归位去处": target,
  };

  const record = await updateRecord(TABLE, c.req.param("id"), fields);
  if (!record) return c.json({ error: "Route failed" }, 500);
  return c.json({ inbox: toFrontend(record), routedId: target, target });
});

export default app;
