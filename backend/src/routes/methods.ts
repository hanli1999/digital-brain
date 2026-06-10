import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

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
  const feishuId = await syncAfterCreate("method", item.id, body, async (fid) => {
    await prisma.method.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.method.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.method.findUnique({ where: { id } });
  const item = await prisma.method.update({
    where: { id },
    data: { title: body.title, content: body.content, tags: body.tags },
  });
  await syncAfterUpdate("method", existing?.feishuId ?? null, body);
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.method.findUnique({ where: { id } });
  await prisma.method.delete({ where: { id } });
  await syncAfterDelete("method", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
