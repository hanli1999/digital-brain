import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const items = await prisma.calendarEvent.findMany({ orderBy: { startTime: "asc" }, take: 200 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.calendarEvent.create({
    data: { title: body.title, description: body.description || "", startTime: new Date(body.startTime), endTime: body.endTime ? new Date(body.endTime) : new Date(body.startTime) },
  });
  return c.json(item, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.calendarEvent.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const data: Record<string, unknown> = { title: body.title, description: body.description };
  if (body.startTime) data.startTime = new Date(body.startTime);
  if (body.endTime) data.endTime = new Date(body.endTime);
  const item = await prisma.calendarEvent.update({ where: { id: c.req.param("id") }, data });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  await prisma.calendarEvent.delete({ where: { id: c.req.param("id") } });
  return c.json({ ok: true });
});

export default app;
