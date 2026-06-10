import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";

const quickLinks = [
  { href: "/inbox", label: "收件箱", desc: "管理待处理条目", color: "border-l-blue-500" },
  { href: "/tasks", label: "任务板", desc: "查看进行中的任务", color: "border-l-orange-500" },
  { href: "/tools", label: "工具箱", desc: "浏览工具集", color: "border-l-green-500" },
  { href: "/methods", label: "方法库", desc: "查阅工作方法", color: "border-l-purple-500" },
  { href: "/analytics", label: "数据中心", desc: "查看量化指标", color: "border-l-red-500" },
];

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [inbox, tasks] = await Promise.all([
        apiFetch(`/inbox?status=pending`).then((r) => r.json()),
        apiFetch(`/tasks?status=todo`).then((r) => r.json()),
      ]);
      return { pendingInbox: inbox.length, todoTasks: tasks.length };
    },
    refetchInterval: 30000,
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">待处理收件箱</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.pendingInbox ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">待办任务</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.todoTasks ?? "-"}</p></CardContent>
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground mb-3">快捷入口</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            <Card className={`border-l-4 ${link.color} hover:shadow-sm transition-shadow cursor-pointer h-full`}>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">{link.label}</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground">{link.desc}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
