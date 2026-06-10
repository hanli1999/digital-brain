import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import type { InboxItem, Task } from "@/types/api";

export default function Dashboard() {
  const { data: stats } = useQuery({
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

      return { todayCount, pending, inProgress, completed, total: inbox.length, processed, modules, recent };
    },
    refetchInterval: 30000,
  });

  return (
    <div>
      {/* Module Panorama Grid */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 tracking-wide">洞府全景</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stats?.modules.map((mod) => (
          <Link key={mod.key} to={mod.href}>
            <Card className="border-border/50 bg-linear-to-b from-card to-card/90 hover:border-primary/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-200 group cursor-pointer h-full">
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
                  style={{ width: `${stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                {stats.processed}/{stats.total} ({stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats && stats.total === 0 && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/5 to-transparent p-10 text-center">
          <p className="text-lg font-semibold text-primary">欢迎使用数字大脑</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            从
            <Link to="/inbox" className="text-primary underline decoration-primary/30 underline-offset-4 mx-1 font-medium">收件箱</Link>
            开始添加你的第一条记录
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.recent.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">最近动态</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">{item.module}</span>
                  <span className="truncate text-muted-foreground">{item.title || "(无标题)"}</span>
                  <span className="text-xs text-muted-foreground/50 shrink-0 ml-auto">
                    {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
