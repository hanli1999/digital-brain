import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(import.meta.dirname, "../../uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.fileAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/upload", async (c) => {
  const body = await c.req.json();
  const { filename, data, mimeType } = body;
  const buf = Buffer.from(data, "base64");
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  writeFileSync(join(UPLOAD_DIR, safeName), buf);

  const item = await prisma.fileAsset.create({
    data: { filename, url: `/uploads/${safeName}`, mimeType: mimeType || "application/octet-stream", size: buf.length },
  });
  const feishuId = await syncAfterCreate("file", item.id, { filename, url: item.url, mimeType: item.mimeType, size: item.size }, async (fid) => {
    await prisma.fileAsset.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "file", entityId: item.id } },
    create: { entityType: "file", entityId: item.id, title: item.filename, content: item.mimeType, tags: item.tags },
    update: { title: item.filename, content: item.mimeType, tags: item.tags },
  });
  return c.json({ ...item, feishuId }, 201);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.fileAsset.create({
    data: { filename: body.filename, url: body.url || "", mimeType: body.mimeType || "application/octet-stream", size: body.size || 0, tags: body.tags || "[]" },
  });
  const feishuId = await syncAfterCreate("file", item.id, body, async (fid) => {
    await prisma.fileAsset.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "file", entityId: item.id } },
    create: { entityType: "file", entityId: item.id, title: item.filename, content: item.mimeType, tags: item.tags },
    update: { title: item.filename, content: item.mimeType, tags: item.tags },
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
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "file", entityId: id } },
    create: { entityType: "file", entityId: id, title: item.filename, content: item.mimeType, tags: item.tags },
    update: { title: item.filename, content: item.mimeType, tags: item.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.fileAsset.findUnique({ where: { id } });
  await prisma.fileAsset.delete({ where: { id } });
  await prisma.searchIndex.deleteMany({ where: { entityType: "file", entityId: id } });
  await syncAfterDelete("file", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

export default app;
