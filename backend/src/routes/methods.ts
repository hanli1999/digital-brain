import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.method.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.method.create({
    data: { title: body.title, content: body.content || "", tags: body.tags || "[]" },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "method", entityId: item.id } },
    create: { entityType: "method", entityId: item.id, title: item.title, content: item.content, tags: item.tags },
    update: { title: item.title, content: item.content, tags: item.tags },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.method.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.method.update({
    where: { id: c.req.param("id") },
    data: { title: body.title, content: body.content, tags: body.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.method.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
