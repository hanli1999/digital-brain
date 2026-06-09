import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.aiMechanism.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.aiMechanism.create({
    data: { name: body.name, type: body.type || "prompt", content: body.content || "", parameters: body.parameters || "{}" },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "ai_mechanism", entityId: item.id } },
    create: { entityType: "ai_mechanism", entityId: item.id, title: item.name, content: item.content },
    update: { title: item.name, content: item.content },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.aiMechanism.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.aiMechanism.update({
    where: { id: c.req.param("id") },
    data: { name: body.name, type: body.type, content: body.content, parameters: body.parameters },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.aiMechanism.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
