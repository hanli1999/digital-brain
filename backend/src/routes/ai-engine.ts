import { Hono } from "hono";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, type FeishuRecord } from "../lib/feishu.js";

const TABLE = "tblBgV1gLsh22qbV";

const CN_TO_EN: Record<string, string> = {
  "机制名称": "name",
  "所属组件": "component",
  "核心理念": "coreIdea",
  "关键特征": "features",
  "详细关键特征": "featuresDetail",
  "实践示例": "examples",
  "适用场景": "scenarios",
  "详细适用场景": "scenariosDetail",
  "来源": "source",
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
  if (body.name) fields["机制名称"] = body.name;
  if (body.component) fields["所属组件"] = body.component;
  if (body.coreIdea) fields["核心理念"] = body.coreIdea;
  if (body.features) fields["关键特征"] = body.features;
  if (body.featuresDetail) fields["详细关键特征"] = body.featuresDetail;
  if (body.examples) fields["实践示例"] = body.examples;
  if (body.scenarios) fields["适用场景"] = body.scenarios;
  if (body.scenariosDetail) fields["详细适用场景"] = body.scenariosDetail;
  if (body.source) fields["来源"] = body.source;

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
  if (body.name !== undefined) fields["机制名称"] = body.name;
  if (body.component !== undefined) fields["所属组件"] = body.component;
  if (body.coreIdea !== undefined) fields["核心理念"] = body.coreIdea;
  if (body.features !== undefined) fields["关键特征"] = body.features;
  if (body.featuresDetail !== undefined) fields["详细关键特征"] = body.featuresDetail;
  if (body.examples !== undefined) fields["实践示例"] = body.examples;
  if (body.scenarios !== undefined) fields["适用场景"] = body.scenarios;
  if (body.scenariosDetail !== undefined) fields["详细适用场景"] = body.scenariosDetail;
  if (body.source !== undefined) fields["来源"] = body.source;

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
