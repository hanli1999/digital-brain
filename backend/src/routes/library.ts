import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.document.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.document.create({
    data: { title: body.title, abstract: body.abstract || "", author: body.author || "", tags: body.tags || "[]" },
  });
  const feishuId = await syncAfterCreate("document", item.id, body, async (fid) => {
    await prisma.document.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "library", entityId: item.id } },
    create: { entityType: "library", entityId: item.id, title: item.title, content: item.abstract, tags: item.tags },
    update: { title: item.title, content: item.abstract, tags: item.tags },
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.document.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.document.findUnique({ where: { id } });
  const item = await prisma.document.update({
    where: { id },
    data: { title: body.title, abstract: body.abstract, author: body.author, tags: body.tags },
  });
  await syncAfterUpdate("document", existing?.feishuId ?? null, body);
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "library", entityId: id } },
    create: { entityType: "library", entityId: id, title: item.title, content: item.abstract, tags: item.tags },
    update: { title: item.title, content: item.abstract, tags: item.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.document.findUnique({ where: { id } });
  await prisma.document.delete({ where: { id } });
  await prisma.searchIndex.deleteMany({ where: { entityType: "library", entityId: id } });
  await syncAfterDelete("document", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
