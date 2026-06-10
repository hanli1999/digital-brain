import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.insight.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.insight.create({
    data: {
      title: body.title || "",
      content: body.content || "",
      category: body.category || "",
      source: body.source || "",
      tags: body.tags || "[]",
    },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.insight.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.source !== undefined) data.source = body.source;
  if (body.tags !== undefined) data.tags = body.tags;

  const item = await prisma.insight.update({ where: { id: c.req.param("id") }, data });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.insight.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
