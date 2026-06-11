import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/feishu.js";
import { toEnglish, toFeishuFields } from "../lib/field-map.js";
import { ROUTE_TARGETS, resolveTarget } from "../lib/route-targets.js";
import { prisma } from "../lib/prisma.js";

const TABLE = "tbl2pG26LdF3c3cX";

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
  if (body.content) input.content = body.content;
  if (body.status) input.status = body.status;
  if (body.category) input.category = body.category;
  if (body.tags) input.tags = body.tags;
  if (body.source) input.source = body.source;
  if (body.mood) input.mood = body.mood;
  if (body.routeTarget) input.routeTarget = body.routeTarget;
  if (body.routedTo) input.routedTo = body.routedTo;
  if (body.sourceUrl) input.sourceUrl = body.sourceUrl;
  if (body.aiSummary) input.aiSummary = body.aiSummary;
  if (body.collectedAt) input.collectedAt = body.collectedAt;

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
  if (body.content !== undefined) input.content = body.content;
  if (body.status !== undefined) input.status = body.status;
  if (body.category !== undefined) input.category = body.category;
  if (body.tags !== undefined) input.tags = body.tags;
  if (body.source !== undefined) input.source = body.source;
  if (body.mood !== undefined) input.mood = body.mood;
  if (body.routeTarget !== undefined) input.routeTarget = body.routeTarget;
  if (body.routedTo !== undefined) input.routedTo = body.routedTo;
  if (body.sourceUrl !== undefined) input.sourceUrl = body.sourceUrl;
  if (body.aiSummary !== undefined) input.aiSummary = body.aiSummary;
  if (body.collectedAt !== undefined) input.collectedAt = body.collectedAt;

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

app.post("/:id/route", async (c) => {
  const body = await c.req.json();
  const rawTarget = body.routeTarget as string;
  if (!rawTarget) return c.json({ error: "Missing routeTarget" }, 400);

  // 统一解析 target：AI 中文名 → 模块 key，前端英文 key → 直接使用
  const targetKey = resolveTarget(rawTarget) || rawTarget;
  const cfg = ROUTE_TARGETS[targetKey];
  if (!cfg) return c.json({ error: `Unknown target: ${targetKey}` }, 400);

  // 读取收件箱记录
  const inboxRecord = await getRecord(TABLE, c.req.param("id"));
  if (!inboxRecord) return c.json({ error: "Inbox record not found" }, 404);
  const inbox = await toEnglish(TABLE, inboxRecord) as Record<string, unknown>;

  let routedId: string | null = null;

  // 创建目标记录
  if (cfg.prismaModel === "insight") {
    const item = await prisma.insight.create({
      data: {
        title: String(inbox.title || ""),
        content: String(inbox.content || ""),
        category: String(inbox.category || ""),
        source: String(inbox.source || "收件箱入库"),
        tags: String(inbox.tags || "[]"),
      },
    });
    routedId = item.id;
  } else if (cfg.tableId) {
    // Feishu 模块：映射字段到目标表
    const targetFields: Record<string, unknown> = {};
    for (const [inboxField, targetField] of Object.entries(cfg.fieldMap)) {
      const v = inbox[inboxField];
      if (v !== undefined && v !== null && v !== "") {
        targetFields[targetField] = v;
      }
    }
    // 补一个默认值确保创建成功
    if (Object.keys(targetFields).length === 0) {
      targetFields[Object.values(cfg.fieldMap)[0] || "title"] = String(inbox.title || "未命名");
    }
    // tags 统一传 JSON 字符串
    if (inbox.tags) targetFields["tags"] = String(inbox.tags);

    const feishuFields = await toFeishuFields(cfg.tableId, targetFields);
    const targetRecord = await createRecord(cfg.tableId, feishuFields);
    if (!targetRecord) return c.json({ error: "Failed to create target record" }, 500);
    routedId = targetRecord.record_id;
  }

  // 更新收件箱状态
  const updateFields = await toFeishuFields(TABLE, {
    routeTarget: rawTarget,
    status: "已炼化",
    routedTo: routedId || cfg.label,
  });
  const updated = await updateRecord(TABLE, c.req.param("id"), updateFields);
  if (!updated) return c.json({ error: "Failed to update inbox status" }, 500);

  return c.json({
    inbox: await toEnglish(TABLE, updated),
    routedId,
    target: targetKey,
    targetLabel: cfg.label,
  });
});

export default app;
