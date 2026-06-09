import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const category = c.req.query("category");
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  const items = await prisma.tool.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.tool.create({
    data: { name: body.name, description: body.description || "", category: body.category || "other", url: body.url || "", tags: body.tags || "[]" },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "tool", entityId: item.id } },
    create: { entityType: "tool", entityId: item.id, title: item.name, content: item.description, tags: item.tags },
    update: { title: item.name, content: item.description, tags: item.tags },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.tool.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.tool.update({
    where: { id: c.req.param("id") },
    data: { name: body.name, description: body.description, category: body.category, url: body.url, tags: body.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.tool.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
