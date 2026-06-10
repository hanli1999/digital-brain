import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.metric.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.metric.create({
    data: { name: body.name, value: body.value || 0, unit: body.unit || "", category: body.category || "" },
  });
  const feishuId = await syncAfterCreate("library", item.id, body, async (fid) => {
    await prisma.metric.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.metric.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.metric.findUnique({ where: { id } });
  const item = await prisma.metric.update({
    where: { id },
    data: { name: body.name, value: body.value, unit: body.unit, category: body.category },
  });
  await syncAfterUpdate("library", existing?.feishuId ?? null, body);
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.metric.findUnique({ where: { id } });
  await prisma.metric.delete({ where: { id } });
  await syncAfterDelete("library", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
