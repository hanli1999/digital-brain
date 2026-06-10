import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

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
  const feishuId = await syncAfterCreate("ai_mechanism", item.id, body, async (fid) => {
    await prisma.aiMechanism.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.aiMechanism.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.aiMechanism.findUnique({ where: { id } });
  const item = await prisma.aiMechanism.update({
    where: { id },
    data: { name: body.name, type: body.type, content: body.content, parameters: body.parameters },
  });
  await syncAfterUpdate("ai_mechanism", existing?.feishuId ?? null, body);
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "ai_mechanism", entityId: id } },
    create: { entityType: "ai_mechanism", entityId: id, title: item.name, content: item.content },
    update: { title: item.name, content: item.content },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.aiMechanism.findUnique({ where: { id } });
  await prisma.aiMechanism.delete({ where: { id } });
  await prisma.searchIndex.deleteMany({ where: { entityType: "ai_mechanism", entityId: id } });
  await syncAfterDelete("ai_mechanism", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
