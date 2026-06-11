import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import type { InboxItem, Task } from "@/types/api";

function yinyueGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了，主人还在修炼吗？";
  if (hour < 9) return "早安，主人。今天的洞府一切安好。";
  if (hour < 12) return "上午好，主人。银月已经巡视过洞府了。";
  if (hour < 14) return "午后时光，主人要小憩片刻吗？";
  if (hour < 18) return "下午好，洞府灵气充沛，适合修炼。";
  if (hour < 22) return "夜幕降临，银月正守护着洞府。";
  return "夜深了，主人该休息了。洞府银月守着呢。";
}

export default function Dashboard() {
  const { data: stats } = useQuery<{
    todayCount: number; pending: number; inProgress: number; completed: number;
    total: number; processed: number; modules: { key: string; label: string; icon: string; href: string; count: number }[];
    recent: { title?: string; name?: string; createdAt: string; module?: string }[];
    refinementRate: number; insights: string[]; stalePendings: number;
  }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [inbox, tasks, tools, methods, library, files, calendar, resources, aiEngine, insights] = await Promise.all([
        apiFetch(`/inbox`).then((r) => r.json()) as Promise<InboxItem[]>,
        apiFetch(`/tasks`).then((r) => r.json()) as Promise<Task[]>,
        apiFetch(`/tools`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/methods`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/library`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/files`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/calendar`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/resources`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/ai-engine`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
        apiFetch(`/insight`).then((r) => r.ok ? r.json() : []) as Promise<unknown[]>,
      ]);

      const pending = inbox.filter((i) => i.status === "pending").length;
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayCount = inbox.filter((i) => new Date(i.createdAt).getTime() >= todayStart).length;
      const inProgress = tasks.filter((t: Task) => t.status === "todo" || t.status === "in_progress").length;
      const completed = tasks.filter((t: Task) => t.status === "done").length;
      const processed = inbox.length - pending;
      const refinementRate = inbox.length > 0 ? Math.round((processed / inbox.length) * 100) : 0;

      const modules = [
        { key: "inbox", label: "收件箱", icon: "📥", href: "/inbox", count: inbox.length },
        { key: "tasks", label: "任务管理", icon: "📋", href: "/tasks", count: tasks.length },
        { key: "tools", label: "工具资源库", icon: "🧰", href: "/tools", count: (tools as unknown[]).length },
        { key: "methods", label: "方法流程库", icon: "📖", href: "/methods", count: (methods as unknown[]).length },
        { key: "library", label: "文献库", icon: "📚", href: "/library", count: (library as unknown[]).length },
        { key: "insight", label: "洞察", icon: "💡", href: "/insight", count: (insights as unknown[]).length },
        { key: "files", label: "文件管理", icon: "📁", href: "/files", count: (files as unknown[]).length },
        { key: "calendar", label: "日程", icon: "📅", href: "/calendar", count: (calendar as unknown[]).length },
        { key: "resources", label: "资源管理", icon: "💎", href: "/resources", count: (resources as unknown[]).length },
        { key: "ai-engine", label: "AI Agent库", icon: "🤖", href: "/ai-engine", count: (aiEngine as unknown[]).length },
      ];

      const allItems = [
        ...inbox.map((i: InboxItem & { module?: string }) => ({ ...i, module: "收件箱" })),
        ...tasks.map((t: Task & { module?: string }) => ({ ...t, module: "任务管理", title: t.title })),
        ...(tools as { title?: string; name?: string; createdAt: string; module?: string }[]).map((t) => ({ ...t, title: t.title || t.name || "", module: "工具资源库" })),
        ...(methods as { title?: string; createdAt: string; module?: string }[]).map((m) => ({ ...m, module: "方法流程库" })),
        ...(library as { title?: string; createdAt: string; module?: string }[]).map((l) => ({ ...l, module: "文献库" })),
        ...(insights as { title?: string; createdAt: string; module?: string }[]).map((i) => ({ ...i, module: "洞察" })),
      ];
      const recent = allItems
        .filter((i) => i.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // AI insight generation
      const emptyModules = modules.filter((m) => m.href !== "/inbox" && m.href !== "/tasks" && m.count === 0).map((m) => m.label);
      const stalePendings = inbox.filter((i) => {
        if (i.status !== "pending") return false;
        const days = (Date.now() - new Date(i.createdAt).getTime()) / 86400000;
        return days > 3;
      }).length;

      const generatedInsights: string[] = [];
      if (stalePendings > 0) generatedInsights.push(`有 ${stalePendings} 条收件箱已等待超过3天，要炼化吗？`);
      if (completed > 0) generatedInsights.push(`已完成 ${completed} 个任务，主人效率不错。`);
      if (todayCount > 0) generatedInsights.push(`今天收集了 ${todayCount} 条新内容。`);
      if (emptyModules.length > 0 && emptyModules.length <= 3) {
        generatedInsights.push(`${emptyModules.join("、")} 还是空的，记得充实洞府。`);
      } else if (emptyModules.length > 3) {
        generatedInsights.push(`有 ${emptyModules.length} 个模块还是空的，从收件箱入库开始吧。`);
      }

      return { todayCount, pending, inProgress, completed, total: inbox.length, processed, modules, recent, refinementRate, insights: generatedInsights, stalePendings };
    },
    refetchInterval: 30000,
  });

  return (
    <div>
      {/* 银月 Greeting */}
      <Card className="mb-5 border-primary/20 bg-linear-to-r from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-30 pointer-events-none select-none">🐺</div>
        <CardContent className="p-4 flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg shrink-0 ring-1 ring-primary/20">
            🧝
          </div>
          <div>
            <p className="text-sm font-medium">{yinyueGreeting()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats ? `洞府共有 ${stats.total} 条记录，${stats.modules.filter((m) => m.count > 0).length}/${stats.modules.length} 个模块有数据` : "银月正在感知洞府状态..."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {stats && stats.insights.length > 0 && (
        <div className="mb-5 p-4 rounded-lg border border-primary/10 bg-linear-to-b from-primary/5 to-background">
          <p className="text-xs text-muted-foreground mb-2 tracking-wide">银月洞察</p>
          <div className="space-y-1.5">
            {stats.insights.map((insight, i) => (
              <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-primary/60 mt-0.5">✦</span>
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Module Panorama Grid */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 tracking-wide">洞府全景</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stats?.modules.map((mod) => (
          <Link key={mod.key} to={mod.href}>
            <Card className="border-border/50 bg-linear-to-b from-card to-card/90 hover:border-primary/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-200 group cursor-pointer h-full relative overflow-hidden">
              {mod.count === 0 && mod.href !== "/tasks" && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                <span className="text-2xl">{mod.icon}</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{mod.label}</span>
                <span className="text-xl font-bold text-foreground tabular-nums">{mod.count}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Refinement Progress */}
      {stats && stats.total > 0 && (
        <Card className="mb-6 border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm">收件箱炼化进度</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                <div
                  className="h-full bg-linear-to-r from-primary/70 to-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_var(--primary)]"
                  style={{ width: `${stats.refinementRate}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                {stats.processed}/{stats.total} ({stats.refinementRate}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.refinementRate >= 100 ? "✨ 全部炼化完毕！银月为洞府的整洁感到骄傲。"
                : stats.refinementRate >= 70 ? "🔥 炼化进度不错，银月会继续辅助主人整理。"
                : stats.refinementRate >= 30 ? "📝 还有不少内容等待炼化，主人加油。"
                : "🌱 洞府初建，每一条炼化都在让洞府更强大。"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats && stats.total === 0 && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/5 to-transparent p-10 text-center">
          <p className="text-lg font-semibold text-primary">洞府初启，万物待生</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            银月已在此等候。从
            <Link to="/inbox" className="text-primary underline decoration-primary/30 underline-offset-4 mx-1 font-medium">收件箱</Link>
            投下第一条记录，洞府便会开始呼吸。
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.recent.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">最近动态</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent.map((item, i) => {
                const title = item.title || "(无标题)";
                const truncated = title.length > 80 ? title.slice(0, 80) + "..." : title;
                return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{item.module}</span>
                  <span className="text-muted-foreground truncate max-w-md" title={title}>{truncated}</span>
                  <span className="text-xs text-muted-foreground/50 shrink-0 ml-auto">
                    {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
