import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import type { InboxItem, Task } from "@/types/api";

const INTERNAL_TAGS = new Set([
  "数字洞府", "使用说明书", "今日收件箱", "机缘录", "功法库", "法器阁", "丹房",
  "AI字段", "炼化结果", "归位去处", "距今天数", "时间权重分",
]);

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [inbox, tasks] = await Promise.all([
        apiFetch(`/inbox`).then((r) => r.json()) as Promise<InboxItem[]>,
        apiFetch(`/tasks`).then((r) => r.json()) as Promise<Task[]>,
      ]);
      const pending = inbox.filter((i) => i.status === "pending").length;
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayCount = inbox.filter((i) => new Date(i.createdAt).getTime() >= todayStart).length;
      const inProgress = tasks.filter((t: Task) => t.status === "todo" || t.status === "in_progress").length;
      const completed = tasks.filter((t: Task) => t.status === "done").length;
      const processed = inbox.length - pending;

      const tagFreq: Record<string, number> = {};
      inbox.forEach((i) => {
        try { (JSON.parse(i.tags) as string[]).filter((t) => !INTERNAL_TAGS.has(t)).forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + 1; }); } catch {}
      });
      const topTags = Object.entries(tagFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      return { todayCount, pending, inProgress, completed, total: inbox.length, processed, topTags };
    },
    refetchInterval: 30000,
  });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-primary/10 bg-linear-to-b from-card to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">今日收录</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats?.todayCount ?? "-"}</p></CardContent>
        </Card>
        <Card className="border-amber-500/10 bg-linear-to-b from-card to-amber-500/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40" />
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">待炼化</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-400">{stats?.pending ?? "-"}</p></CardContent>
        </Card>
        <Card className="border-sky-500/10 bg-linear-to-b from-card to-sky-500/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500/40" />
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">修炼中</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-sky-400">{stats?.inProgress ?? "-"}</p></CardContent>
        </Card>
        <Card className="border-emerald-500/10 bg-linear-to-b from-card to-emerald-500/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40" />
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">已贯通</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-400">{stats?.completed ?? "-"}</p></CardContent>
        </Card>
      </div>

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

      {stats && stats.topTags.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">本周高频标签</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.topTags.map(([tag, count]) => {
              const maxCount = stats.topTags[0][1];
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={tag} className="flex items-center gap-3 group">
                  <span className="text-sm w-24 truncate text-muted-foreground group-hover:text-foreground transition-colors">{tag}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                    <div
                      className="h-full bg-linear-to-r from-primary/50 to-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
