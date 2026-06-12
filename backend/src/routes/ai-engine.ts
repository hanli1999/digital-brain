import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../lib/db.js";

const TABLE = "ai-engine";

const app = new Hono();

app.get("/", async (c) => {
  const records = await listRecords(TABLE);
  return c.json(records);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const input: Record<string, unknown> = {};
  if (body.name) input.name = body.name;
  if (body.component) input.component = body.component;
  if (body.coreIdea) input.coreIdea = body.coreIdea;
  if (body.features) input.features = body.features;
  if (body.featuresDetail) input.featuresDetail = body.featuresDetail;
  if (body.examples) input.examples = body.examples;
  if (body.scenarios) input.scenarios = body.scenarios;
  if (body.scenariosDetail) input.scenariosDetail = body.scenariosDetail;
  if (body.source) input.source = body.source;
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
  if (body.name !== undefined) input.name = body.name;
  if (body.component !== undefined) input.component = body.component;
  if (body.coreIdea !== undefined) input.coreIdea = body.coreIdea;
  if (body.features !== undefined) input.features = body.features;
  if (body.featuresDetail !== undefined) input.featuresDetail = body.featuresDetail;
  if (body.examples !== undefined) input.examples = body.examples;
  if (body.scenarios !== undefined) input.scenarios = body.scenarios;
  if (body.scenariosDetail !== undefined) input.scenariosDetail = body.scenariosDetail;
  if (body.source !== undefined) input.source = body.source;
  if (body.tags !== undefined) input.tags = body.tags;

  const record = await updateRecord(TABLE, c.req.param("id"), input);
  if (!record) return c.json({ error: "Update failed" }, 500);
  return c.json(record);
});

app.delete("/:id", async (c) => {
  const ok = await deleteRecord(TABLE, c.req.param("id"));
  if (!ok) return c.json({ error: "Delete failed" }, 500);
  return c.json({ ok: true });
});

export default app;
