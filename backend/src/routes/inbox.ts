import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { syncAfterCreate, syncAfterUpdate, syncAfterDelete } from "../lib/feishu-sync.js";

const app = new Hono();

app.get("/", async (c) => {
  const status = c.req.query("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  const items = await prisma.inboxItem.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return c.json(items);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const item = await prisma.inboxItem.create({
    data: {
      title: body.title,
      content: body.content || "",
      source: body.source || "manual",
      tags: body.tags || "[]",
      imageUrls: body.imageUrls || "[]",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "inbox", entityId: item.id } },
    create: { entityType: "inbox", entityId: item.id, title: item.title, content: item.content, tags: item.tags },
    update: { title: item.title, content: item.content, tags: item.tags },
  });
  const feishuId = await syncAfterCreate("inbox", item.id, body, async (fid) => {
    await prisma.inboxItem.update({ where: { id: item.id }, data: { feishuId: fid } });
  });
  return c.json({ ...item, feishuId }, 201);
});

app.get("/:id", async (c) => {
  const item = await prisma.inboxItem.findUnique({ where: { id: c.req.param("id") } });
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.put("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const existing = await prisma.inboxItem.findUnique({ where: { id } });
  const item = await prisma.inboxItem.update({
    where: { id },
    data: { title: body.title, content: body.content, tags: body.tags, status: body.status },
  });
  await syncAfterUpdate("inbox", existing?.feishuId ?? null, body);
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "inbox", entityId: id } },
    create: { entityType: "inbox", entityId: id, title: item.title, content: item.content, tags: item.tags },
    update: { title: item.title, content: item.content, tags: item.tags },
  });
  return c.json(item);
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.inboxItem.findUnique({ where: { id } });
  await prisma.inboxItem.delete({ where: { id } });
  await prisma.searchIndex.deleteMany({ where: { entityType: "inbox", entityId: id } });
  await syncAfterDelete("inbox", existing?.feishuId ?? null);
  return c.json({ ok: true });
});

app.post("/:id/route", async (c) => {
  const body = await c.req.json();
  const target = body.routeTarget as string;
  const inboxItem = await prisma.inboxItem.findUnique({ where: { id: c.req.param("id") } });
  if (!inboxItem) return c.json({ error: "Not found" }, 404);

  let routedId = "";
  switch (target) {
    case "task": {
      const task = await prisma.task.create({
        data: { title: inboxItem.title, description: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = task.id;
      break;
    }
    case "tool": {
      const tool = await prisma.tool.create({
        data: { name: inboxItem.title, description: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = tool.id;
      break;
    }
    case "method": {
      const method = await prisma.method.create({
        data: { title: inboxItem.title, content: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = method.id;
      break;
    }
    case "library": {
      const doc = await prisma.document.create({
        data: { title: inboxItem.title, abstract: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = doc.id;
      break;
    }
    case "calendar": {
      const event = await prisma.calendarEvent.create({
        data: { title: inboxItem.title, description: inboxItem.content, startTime: new Date() },
      });
      routedId = event.id;
      break;
    }
    case "ai-engine": {
      const mech = await prisma.aiMechanism.create({
        data: { name: inboxItem.title, content: inboxItem.content },
      });
      routedId = mech.id;
      break;
    }
    case "resources": {
      const resource = await prisma.metric.create({
        data: { name: inboxItem.title, value: 0, unit: "", category: "" },
      });
      routedId = resource.id;
      break;
    }
    default:
      return c.json({ error: `Unknown target: ${target}` }, 400);
  }

  const updated = await prisma.inboxItem.update({
    where: { id: c.req.param("id") },
    data: { status: "routed", routeTarget: target, routedTo: routedId },
  });

  await prisma.auditLog.create({
    data: {
      action: "route",
      entity: "inbox",
      entityId: c.req.param("id"),
      detail: JSON.stringify({ from: "inbox", to: target, routedId }),
    },
  });

  return c.json({ inbox: updated, routedId, target });
});

export default app;
