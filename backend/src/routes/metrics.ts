import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.metric.findMany({ orderBy: { timestamp: "desc" }, take: 200 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.metric.create({
    data: { name: body.name, value: body.value || 0, unit: body.unit || "", category: body.category || "", timestamp: body.timestamp ? new Date(body.timestamp) : new Date() },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.metric.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.metric.update({
    where: { id: c.req.param("id") },
    data: { name: body.name, value: body.value, unit: body.unit, category: body.category },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.metric.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
