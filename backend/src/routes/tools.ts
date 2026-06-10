import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

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
  const feishuId = await syncAfterCreate("tool", item.id, body, async (fid) => {
    await prisma.tool.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.tool.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.tool.findUnique({ where: { id } });
  const item = await prisma.tool.update({
    where: { id },
    data: { name: body.name, description: body.description, category: body.category, url: body.url, tags: body.tags },
  });
  await syncAfterUpdate("tool", existing?.feishuId ?? null, body);
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "tool", entityId: id } },
    create: { entityType: "tool", entityId: id, title: item.name, content: item.description, tags: item.tags },
    update: { title: item.name, content: item.description, tags: item.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.tool.findUnique({ where: { id } });
  await prisma.tool.delete({ where: { id } });
  await prisma.searchIndex.deleteMany({ where: { entityType: "tool", entityId: id } });
  await syncAfterDelete("tool", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
