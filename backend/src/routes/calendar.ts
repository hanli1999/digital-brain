import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/feishu.js";
import { toEnglish, toFeishuFields } from "../lib/field-map.js";

const TABLE = "tblxDBsdrChYhST8";

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
  if (body.description) input.description = body.description;
  if (body.status) input.status = body.status;
  if (body.priority) input.priority = body.priority;
  if (body.startTime) input.startTime = body.startTime;
  if (body.endTime) input.endTime = body.endTime;
  if (body.allDay !== undefined) input.allDay = body.allDay;
  if (body.projectId) input.projectId = body.projectId;

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
  if (body.description !== undefined) input.description = body.description;
  if (body.status !== undefined) input.status = body.status;
  if (body.priority !== undefined) input.priority = body.priority;
  if (body.startTime !== undefined) input.startTime = body.startTime;
  if (body.endTime !== undefined) input.endTime = body.endTime;
  if (body.allDay !== undefined) input.allDay = body.allDay;
  if (body.projectId !== undefined) input.projectId = body.projectId;

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
