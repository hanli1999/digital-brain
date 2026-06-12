import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const app = new Hono();

const MODULES = [
  { key: "inbox", label: "收件箱", model: "inboxItem" },
  { key: "tasks", label: "任务管理", model: "task" },
  { key: "tools", label: "法器阁", model: "tool" },
  { key: "methods", label: "功法库", model: "method" },
  { key: "library", label: "丹房", model: "document" },
  { key: "ai-engine", label: "AI引擎", model: "aiMechanism" },
  { key: "resources", label: "资源库", model: "resource" },
  { key: "insight", label: "洞察", model: "insight" },
  { key: "jiyuanlu", label: "机缘录", model: "jiyuanlu" },
];

app.get("/activity", async (c) => {
  const limit = Math.min(Number(c.req.query("limit")) || 30, 50);

  const queries = MODULES.map(async ({ key, label, model }) => {
    try {
      const records = await (prisma as any)[model].findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return records.map((r: any) => {
        const title = r.title || r.name || "(无标题)";
        const routedTo = r.routedTo || r.routeTarget || "";
        const isRouted = r.status === "routed" || (typeof routedTo === "string" && routedTo.length > 0);
        const isPending = r.status === "pending";
        const createdAtStr = typeof r.createdAt === "string" ? r.createdAt : r.createdAt?.toISOString?.() || "";

        let action: string;
        let description: string;

        if (isRouted) {
          action = "已入库";
          description = `「${title}」已入库到${routedTo || "目标模块"}`;
        } else if (isPending && key === "inbox") {
          action = "待炼化";
          description = `「${title}」等待炼化入库`;
        } else {
          action = "收录";
          description = `「${title}」收录到${label}`;
        }

        return {
          id: r.id,
          moduleKey: key,
          moduleLabel: label,
          title: title.length > 60 ? title.slice(0, 60) + "..." : title,
          action,
          description,
          createdAt: createdAtStr,
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(queries);
  const merged = results
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const grouped: { dateLabel: string; items: typeof merged }[] = [];
  for (const item of merged) {
    const d = new Date(item.createdAt).toDateString();
    const label = d === today ? "今天" : d === yesterday ? "昨天" : new Date(item.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    const last = grouped[grouped.length - 1];
    if (last && last.dateLabel === label) {
      last.items.push(item);
    } else {
      grouped.push({ dateLabel: label, items: [item] });
    }
  }

  return c.json(grouped);
});

app.get("/stats", async (c) => {
  const [inboxCount, taskCount, toolCount, methodCount, libCount, aiCount, insightCount, resourceCount, jiyuanluCount] =
    await Promise.all([
      prisma.inboxItem.count(),
      prisma.task.count(),
      prisma.tool.count(),
      prisma.method.count(),
      prisma.document.count(),
      prisma.aiMechanism.count(),
      prisma.insight.count(),
      prisma.resource.count(),
      prisma.jiyuanlu.count(),
    ]);

  const pendingInbox = await prisma.inboxItem.count({ where: { status: "pending" } });
  const activeTasks = await prisma.task.count({ where: { status: { not: "done" } } });

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
  const stalePendings = await prisma.inboxItem.count({
    where: { status: "pending", createdAt: { lt: threeDaysAgo } },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayInbox = await prisma.inboxItem.count({ where: { createdAt: { gte: todayStart } } });

  return c.json({
    modules: [
      { key: "inbox", label: "收件箱", href: "/inbox", count: inboxCount },
      { key: "tasks", label: "任务管理", href: "/tasks", count: taskCount },
      { key: "tools", label: "法器阁", href: "/tools", count: toolCount },
      { key: "methods", label: "功法库", href: "/methods", count: methodCount },
      { key: "library", label: "丹房", href: "/library", count: libCount },
      { key: "ai-engine", label: "AI Agent库", href: "/ai-engine", count: aiCount },
      { key: "insight", label: "洞察", href: "/insight", count: insightCount },
      { key: "resources", label: "资源管理", href: "/resources", count: resourceCount },
      { key: "jiyuanlu", label: "机缘录", href: "/jiyuanlu", count: jiyuanluCount },
    ],
    pendingInbox,
    activeTasks,
    stalePendings,
    todayInbox,
    total: inboxCount + taskCount + toolCount + methodCount + libCount + aiCount + insightCount + resourceCount + jiyuanluCount,
  });
});

export default app;
