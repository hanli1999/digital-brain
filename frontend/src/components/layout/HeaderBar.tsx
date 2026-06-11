"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { useAuth } from "@/lib/AuthContext";
import { useThemeContext } from "@/components/providers/ThemeProvider";
import { API_BASE_URL } from "@/config/api";

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
  "/insight": "洞察",
  "/search": "全局搜索",
  "/settings": "设置",
};

export function HeaderBar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useThemeContext();
  const title = pageTitles[pathname] || "";
  const [online, setOnline] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/status`)
      .then((r) => r.json())
      .then((d) => setOnline(d.status === "online"))
      .catch(() => setOnline(false));
  }, []);

  return (
    <header className="h-14 border-b border-sidebar-border/60 flex items-center justify-between px-6 fixed top-0 left-56 right-0 bg-background/95 backdrop-blur-sm z-10">
      <h1 className="text-sm font-semibold text-muted-foreground tracking-wide">{title}</h1>
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
            className="w-48 h-8 text-xs border-primary/10 focus-visible:ring-primary/30 bg-muted/50"
          />
        </form>
        <button
            type="button"
            onClick={() => setTheme(theme === "dark-amber" ? "cave-fresh" : "dark-amber")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border/50"
            title={theme === "dark-amber" ? "切换到清新洞府" : "切换到暗琥珀"}
          >
            {theme === "dark-amber" ? "🌙" : "☀️"}
          </button>
          <SyncIndicator />
        <span className="flex items-center gap-1.5 text-xs">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_6px_var(--emerald-400)]" : "bg-red-400"}`} />
          <span className={online ? "text-emerald-400/80" : "text-red-400/80"}>银月</span>
          <span className="text-muted-foreground/50">{online ? "在线" : "离线"}</span>
        </span>
        <span className="text-xs text-muted-foreground/50">{user?.username}</span>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={logout}>退出</Button>
      </div>
    </header>
  );
}
