import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tblfsL2sxubcpw0i";

const CN_TO_EN: Record<string, string> = {
  "标题": "title",
  "作者/来源": "author",
  "原文链接": "url",
  "摘要/核心观点": "abstract",
  "核心词": "keywords",
  "文献类型": "type",
  "阅读状态": "status",
  "重要度": "importance",
  "发表日期": "publishedAt",
  "原文片段": "snippet",
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
  if (body.title) fields["标题"] = body.title;
  if (body.author) fields["作者/来源"] = body.author;
  if (body.url) fields["原文链接"] = body.url;
  if (body.abstract) fields["摘要/核心观点"] = body.abstract;
  if (body.keywords) fields["核心词"] = typeof body.keywords === "string" ? body.keywords : JSON.stringify(body.keywords);
  if (body.type) fields["文献类型"] = body.type;
  if (body.status) fields["阅读状态"] = body.status;
  if (body.importance !== undefined) fields["重要度"] = body.importance;
  if (body.publishedAt) fields["发表日期"] = body.publishedAt;
  if (body.snippet) fields["原文片段"] = body.snippet;

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
  if (body.title !== undefined) fields["标题"] = body.title;
  if (body.author !== undefined) fields["作者/来源"] = body.author;
  if (body.url !== undefined) fields["原文链接"] = body.url;
  if (body.abstract !== undefined) fields["摘要/核心观点"] = body.abstract;
  if (body.keywords !== undefined) fields["核心词"] = typeof body.keywords === "string" ? body.keywords : JSON.stringify(body.keywords);
  if (body.type !== undefined) fields["文献类型"] = body.type;
  if (body.status !== undefined) fields["阅读状态"] = body.status;
  if (body.importance !== undefined) fields["重要度"] = body.importance;
  if (body.publishedAt !== undefined) fields["发表日期"] = body.publishedAt;
  if (body.snippet !== undefined) fields["原文片段"] = body.snippet;

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
