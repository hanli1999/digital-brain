"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { useAuth } from "@/lib/AuthContext";

const pageTitles: Record<string, string> = {
  "/": "仪表盘",
  "/inbox": "收件箱",
  "/tasks": "任务板",
  "/tools": "工具箱",
  "/analytics": "数据中心",
  "/methods": "方法库",
  "/ai-engine": "AI 引擎配置",
  "/library": "文献库",
  "/files": "文件管理",
  "/calendar": "日程",
  "/search": "全局搜索",
  "/settings": "设置",
};

export function HeaderBar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const title = pageTitles[pathname] || "";

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 fixed top-0 left-56 right-0 bg-background z-10">
      <h1 className="text-sm font-semibold text-muted-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q") as string;
            if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <Input
            name="q"
            type="search"
            placeholder="搜索..."
            className="w-48 h-8 text-xs"
          />
        </form>
        <SyncIndicator />
        <span className="text-xs text-muted-foreground">{user?.username}</span>
        <Button variant="ghost" size="sm" className="text-xs" onClick={logout}>退出</Button>
      </div>
    </header>
  );
}
