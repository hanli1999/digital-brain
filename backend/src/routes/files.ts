import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

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
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.fileAsset.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const item = await prisma.fileAsset.update({
    where: { id: c.req.param("id") },
    data: { filename: body.filename, url: body.url, tags: body.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.fileAsset.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
