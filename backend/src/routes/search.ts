import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

app.get("/", async (c) => {
  const q = c.req.query("q") || "";
  if (!q.trim()) return c.json([]);
  const results = await prisma.searchIndex.findMany({
    where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] },
    take: 20,
  });
  return c.json(results);
});

export default app;
