import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.document.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.document.create({
    data: { title: body.title, abstract: body.abstract || "", author: body.author || "", tags: body.tags || "[]" },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "document", entityId: item.id } },
    create: { entityType: "document", entityId: item.id, title: item.title, content: item.abstract, tags: item.tags },
    update: { title: item.title, content: item.abstract, tags: item.tags },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.document.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.document.update({
    where: { id: c.req.param("id") },
    data: { title: body.title, abstract: body.abstract, author: body.author, tags: body.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.document.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
