import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tblxDBsdrChYhST8";

const CN_TO_EN: Record<string, string> = {
  "任务标题": "title",
  "任务内容": "content",
  "任务描述": "description",
  "任务状态": "status",
  "任务优先级": "priority",
  "任务开始时间": "startTime",
  "任务截止时间": "endTime",
  "是否为全天任务": "allDay",
  "所属项目ID": "projectId",
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
  if (body.title) fields["任务标题"] = body.title;
  if (body.content) fields["任务内容"] = body.content;
  if (body.description) fields["任务描述"] = body.description;
  if (body.status) fields["任务状态"] = body.status;
  if (body.priority) fields["任务优先级"] = body.priority;
  if (body.startTime) fields["任务开始时间"] = body.startTime;
  if (body.endTime) fields["任务截止时间"] = body.endTime;
  if (body.allDay !== undefined) fields["是否为全天任务"] = body.allDay;
  if (body.projectId) fields["所属项目ID"] = body.projectId;

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
  if (body.title !== undefined) fields["任务标题"] = body.title;
  if (body.content !== undefined) fields["任务内容"] = body.content;
  if (body.description !== undefined) fields["任务描述"] = body.description;
  if (body.status !== undefined) fields["任务状态"] = body.status;
  if (body.priority !== undefined) fields["任务优先级"] = body.priority;
  if (body.startTime !== undefined) fields["任务开始时间"] = body.startTime;
  if (body.endTime !== undefined) fields["任务截止时间"] = body.endTime;
  if (body.allDay !== undefined) fields["是否为全天任务"] = body.allDay;
  if (body.projectId !== undefined) fields["所属项目ID"] = body.projectId;

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
