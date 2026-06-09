import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const status = c.req.query("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const items = await prisma.task.findMany({ where, orderBy: [{ priority: "asc" }, { createdAt: "desc" }], take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.task.create({
    data: { title: body.title, description: body.description || "", status: body.status || "todo", priority: body.priority || "normal", tags: body.tags || "[]" },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "task", entityId: item.id } },
    create: { entityType: "task", entityId: item.id, title: item.title, content: item.description, tags: item.tags },
    update: { title: item.title, content: item.description, tags: item.tags },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.task.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.task.update({
    where: { id: c.req.param("id") },
    data: { title: body.title, description: body.description, status: body.status, priority: body.priority, tags: body.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.task.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
