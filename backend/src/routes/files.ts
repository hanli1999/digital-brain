import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.fileAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.fileAsset.create({
    data: { filename: body.filename, url: body.url || "", mimeType: body.mimeType || "application/octet-stream", size: body.size || 0, tags: body.tags || "[]" },
  });
  const feishuId = await syncAfterCreate("file", item.id, body, async (fid) => {
    await prisma.fileAsset.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.fileAsset.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.fileAsset.findUnique({ where: { id } });
  const item = await prisma.fileAsset.update({
    where: { id },
    data: { filename: body.filename, url: body.url, tags: body.tags },
  });
  await syncAfterUpdate("file", existing?.feishuId ?? null, body);
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.fileAsset.findUnique({ where: { id } });
  await prisma.fileAsset.delete({ where: { id } });
  await syncAfterDelete("file", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
