import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import type { InboxItem, Task } from "@/types/api";

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
        try { (JSON.parse(i.tags) as string[]).forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + 1; }); } catch {}
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
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">今日收录</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.todayCount ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">待炼化</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-500">{stats?.pending ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">修炼中</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-500">{stats?.inProgress ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">已贯通</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-500">{stats?.completed ?? "-"}</p></CardContent>
        </Card>
      </div>

      {stats && stats.total > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm">收件箱炼化进度</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {stats.processed}/{stats.total} ({stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && stats.total === 0 && (
        <div className="mb-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
          <p className="text-base font-medium text-primary">欢迎使用数字大脑</p>
          <p className="text-sm text-muted-foreground mt-2">
            从
            <Link to="/inbox" className="text-primary underline mx-1">收件箱</Link>
            开始添加你的第一条记录
          </p>
        </div>
      )}

      {stats && stats.topTags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">本周高频标签</h2>
          <div className="space-y-2">
            {stats.topTags.map(([tag, count]) => {
              const maxCount = stats.topTags[0][1];
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-sm w-20 truncate">{tag}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
