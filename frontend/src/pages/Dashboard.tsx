import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import { safeDate } from "@/lib/utils";
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

interface ActivityItem {
  id: string;
  moduleKey: string;
  moduleLabel: string;
  title: string;
  action: string;
  description: string;
  createdAt: string;
}

interface ActivityGroup {
  dateLabel: string;
  items: ActivityItem[];
}

interface DashboardStats {
  modules: { key: string; label: string; href: string; count: number }[];
  pendingInbox: number;
  activeTasks: number;
  stalePendings: number;
  todayInbox: number;
  total: number;
}

const MODULE_ICONS: Record<string, string> = {
  inbox: "📥", tasks: "📋", tools: "🧰", methods: "📖",
  library: "📚", "ai-engine": "🤖", insight: "💡",
  resources: "💎", jiyuanlu: "🌟",
};

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiFetch("/dashboard/stats").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: activity } = useQuery<ActivityGroup[]>({
    queryKey: ["dashboard-activity"],
    queryFn: () => apiFetch("/dashboard/activity?limit=30").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: inbox } = useQuery<InboxItem[]>({
    queryKey: ["inbox"],
    queryFn: () => apiFetch("/inbox").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiFetch("/tasks").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const refinementRate = inbox && stats
    ? Math.round(((stats.total > 0 ? inbox.filter((i) => i.status !== "pending").length : 0) / Math.max(inbox.length, 1)) * 100)
    : 0;
  const processed = inbox ? inbox.filter((i) => i.status !== "pending").length : 0;

  const insights: string[] = [];
  if (stats) {
    if (stats.stalePendings > 0) insights.push(`有 ${stats.stalePendings} 条收件箱已等待超过3天，要炼化吗？`);
    if (stats.todayInbox > 0) insights.push(`今天收集了 ${stats.todayInbox} 条新内容。`);
    if (stats.activeTasks > 0) insights.push(`有 ${stats.activeTasks} 个任务正在进行中。`);
    const emptyModules = stats.modules.filter((m) => m.key !== "inbox" && m.key !== "tasks" && m.count === 0);
    if (emptyModules.length === 1) insights.push(`${emptyModules[0].label} 还是空的，记得充实洞府。`);
    else if (emptyModules.length > 1) insights.push(`有 ${emptyModules.length} 个模块还是空的，从收件箱入库开始吧。`);
  }

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
      {insights.length > 0 && (
        <div className="mb-5 p-4 rounded-lg border border-primary/10 bg-linear-to-b from-primary/5 to-background">
          <p className="text-xs text-muted-foreground mb-2 tracking-wide">银月洞察</p>
          <div className="space-y-1.5">
            {insights.map((insight, i) => (
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
              {mod.count === 0 && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              )}
              <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                <span className="text-2xl">{MODULE_ICONS[mod.key] || "📦"}</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{mod.label}</span>
                <span className="text-xl font-bold text-foreground tabular-nums">{mod.count}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Refinement Progress */}
      {stats && (stats.pendingInbox > 0 || inbox && inbox.length > 0) && (
        <Card className="mb-6 border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm">收件箱炼化进度</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                <div
                  className="h-full bg-linear-to-r from-primary/70 to-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_var(--primary)]"
                  style={{ width: `${refinementRate}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                {processed}/{inbox?.length || 0} ({refinementRate}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {refinementRate >= 100 ? "✨ 全部炼化完毕！银月为洞府的整洁感到骄傲。"
                : refinementRate >= 70 ? "🔥 炼化进度不错，银月会继续辅助主人整理。"
                : refinementRate >= 30 ? "📝 还有不少内容等待炼化，主人加油。"
                : stats.pendingInbox > 0 ? "🌱 洞府初建，每一条炼化都在让洞府更强大。"
                : "📭 收件箱还是空的，从上方输入框投下第一条记录吧。"}
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

      {/* Activity Timeline */}
      {activity && activity.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              洞府动态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/50" />

              <div className="space-y-4">
                {activity.map((group) => (
                  <div key={group.dateLabel}>
                    <div className="flex items-center gap-3 mb-2.5 pl-0">
                      <div className="w-[15px] h-[15px] rounded-full bg-card border-2 border-primary/30 shrink-0 relative z-10" />
                      <span className="text-xs font-medium text-muted-foreground/70">{group.dateLabel}</span>
                    </div>

                    <div className="space-y-1.5 pl-7">
                      {group.items.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 text-sm group/item py-1 px-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full border border-border/30 shrink-0 mt-px text-muted-foreground group-hover/item:text-foreground transition-colors">
                            {item.moduleLabel}
                          </span>
                          <span className="text-muted-foreground truncate group-hover/item:text-foreground transition-colors flex-1 min-w-0">
                            {item.description}
                          </span>
                          <span className="text-xs text-muted-foreground/50 shrink-0 mt-px tabular-nums">
                            {new Date(item.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                      {group.items.length > 8 && (
                        <p className="text-xs text-muted-foreground/50 pl-2 pt-1">还有 {group.items.length - 8} 条动态</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback: simple recent list when no activity data */}
      {(!activity || activity.length === 0) && inbox && inbox.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">最近动态</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inbox.slice(0, 5).map((item, i) => {
                const title = item.title || "(无标题)";
                const truncated = title.length > 80 ? title.slice(0, 80) + "..." : title;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full shrink-0">收件箱</span>
                    <span className="text-muted-foreground truncate max-w-md">{truncated}</span>
                    <span className="text-xs text-muted-foreground/50 shrink-0 ml-auto">{safeDate(item.createdAt)}</span>
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
