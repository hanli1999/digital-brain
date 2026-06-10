import { Hono } from "hono";
import { isFeishuConfigured, pullTable, tables, syncCreate } from "../lib/feishu-sync.js";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

// GET /api/sync/status — check Feishu configuration
app.get("/status", async (c) => {
  const configured = isFeishuConfigured();
  return c.json({
    configured,
    tables: Object.entries(tables).map(([key, cfg]) => ({
      key,
      tableName: cfg.tableName,
      tableId: cfg.tableId,
    })),
  });
});

// POST /api/sync/import/:table — pull a single table from Feishu
app.post("/import/:table", async (c) => {
  if (!isFeishuConfigured()) return c.json({ error: "Feishu not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET in .env" }, 400);

  const table = c.req.param("table");
  if (!tables[table]) {
    return c.json({ error: `Unknown table: ${table}. Available: ${Object.keys(tables).join(", ")}` }, 400);
  }

  const result = await pullTable(table);
  return c.json(result);
});

// POST /api/sync/import — pull all tables from Feishu
app.post("/import", async (c) => {
  if (!isFeishuConfigured()) return c.json({ error: "Feishu not configured. Set FEISHU_APP_ID and FEISHU_APP_SECRET in .env" }, 400);

  const results = [];
  for (const key of Object.keys(tables)) {
    const result = await pullTable(key);
    results.push(result);
  }
  return c.json(results);
});

// POST /api/sync/export/:table — push local records to Feishu
app.post("/export/:table", async (c) => {
  if (!isFeishuConfigured()) return c.json({ error: "Feishu not configured" }, 400);

  const table = c.req.param("table");
  if (!tables[table]) {
    return c.json({ error: `Unknown table: ${table}` }, 400);
  }

  let records: Record<string, unknown>[] = [];
  switch (table) {
    case "inbox": records = await prisma.inboxItem.findMany(); break;
    case "task": records = await prisma.task.findMany(); break;
    case "tool": records = await prisma.tool.findMany(); break;
    case "method": records = await prisma.method.findMany(); break;
    case "document": records = await prisma.document.findMany(); break;
    case "file": records = await prisma.fileAsset.findMany(); break;
    case "calendar": records = await prisma.calendarEvent.findMany(); break;
    case "ai_mechanism": records = await prisma.aiMechanism.findMany(); break;
    case "library": records = await prisma.metric.findMany(); break;
  }

  let synced = 0;
  let errors = 0;
  for (const record of records) {
    try {
      const data = { ...record };
      if (data.feishuId) {
        // update existing
        // syncUpdate works via feishuId — skip for bulk export simplicity, only create new
        continue;
      }
      const fid = await syncCreate(table, data as Record<string, unknown>);
      if (fid) {
        // update local feishuId
        const updateData = { feishuId: fid };
        switch (table) {
          case "inbox": await prisma.inboxItem.update({ where: { id: record.id as string }, data: updateData }); break;
          case "task": await prisma.task.update({ where: { id: record.id as string }, data: updateData }); break;
          case "tool": await prisma.tool.update({ where: { id: record.id as string }, data: updateData }); break;
          case "method": await prisma.method.update({ where: { id: record.id as string }, data: updateData }); break;
          case "document": await prisma.document.update({ where: { id: record.id as string }, data: updateData }); break;
          case "file": await prisma.fileAsset.update({ where: { id: record.id as string }, data: updateData }); break;
          case "calendar": await prisma.calendarEvent.update({ where: { id: record.id as string }, data: updateData }); break;
          case "ai_mechanism": await prisma.aiMechanism.update({ where: { id: record.id as string }, data: updateData }); break;
          case "library": await prisma.metric.update({ where: { id: record.id as string }, data: updateData }); break;
        }
        synced++;
      }
    } catch (e) {
      errors++;
      console.error(`[sync] export ${table}/${(record as Record<string, unknown>).id} failed:`, e);
    }
  }

  return c.json({ table, synced, errors, total: records.length });
});

// GET /api/sync/logs — recent sync logs
app.get("/logs", async (c) => {
  const logs = await prisma.feishuSyncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json(logs);
});

export default app;
