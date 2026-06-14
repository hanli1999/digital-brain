import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "calendar";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
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
  if (body.taskId) input.taskId = body.taskId;
  if (body.timezone) input.timezone = body.timezone;
  if (body.repeatFlag) input.repeatFlag = body.repeatFlag;
  if (body.reminder) input.reminder = body.reminder;
  if (body.completedAt) input.completedAt = body.completedAt;
  if (body.sort !== undefined) input.sort = body.sort;
  if (body.subtasks) input.subtasks = body.subtasks;
  if (body.tags) input.tags = body.tags;

  const record = await createRecord(TABLE, input);
  if (!record) return c.json({ error: "Failed to create" }, 500);
  return c.json(record, 201);
});

app.get("/:id", async (c) => {
  const record = await getRecord(TABLE, c.req.param("id"));
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(record);
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
  if (body.taskId !== undefined) input.taskId = body.taskId;
  if (body.timezone !== undefined) input.timezone = body.timezone;
  if (body.repeatFlag !== undefined) input.repeatFlag = body.repeatFlag;
  if (body.reminder !== undefined) input.reminder = body.reminder;
  if (body.completedAt !== undefined) input.completedAt = body.completedAt;
  if (body.sort !== undefined) input.sort = body.sort;
  if (body.subtasks !== undefined) input.subtasks = body.subtasks;
  if (body.tags !== undefined) input.tags = body.tags;

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Not found" }, 404);
  return c.json(record);
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export default app;
