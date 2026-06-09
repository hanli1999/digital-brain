import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const all = await prisma.settings.findMany();
  const map: Record<string, string> = {};
  for (const { key, value } of all) map[key] = value;
  return c.json(map);
});

app.put("/", async (c) => {
  const body = await c.req.json();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    await prisma.settings.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  return c.json({ ok: true });
});

export default app;
