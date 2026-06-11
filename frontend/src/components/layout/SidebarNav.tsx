"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/config/api";

const coreItems = [
  { href: "/inbox", label: "收件箱", icon: "📥" },
  { href: "/tasks", label: "任务管理", icon: "📋" },
  { href: "/tools", label: "工具资源库", icon: "🧰" },
  { href: "/methods", label: "方法流程库", icon: "📖" },
  { href: "/search", label: "全局搜索", icon: "🔍" },
];

const moreItems = [
  { href: "/ai-engine", label: "AI Agent库", icon: "🤖" },
  { href: "/library", label: "文献库", icon: "📚" },
  { href: "/files", label: "文件管理", icon: "📁" },
  { href: "/calendar", label: "任务清单", icon: "📅" },
  { href: "/resources", label: "资源管理", icon: "💎" },
  { href: "/insight", label: "洞察", icon: "💡" },
];

export function SidebarNav() {
  const pathname = useLocation().pathname;
  const [showMore, setShowMore] = useState(false);
  const isInMore = moreItems.some((i) => i.href === pathname);

  const { data: pendingCount } = useQuery({
    queryKey: ["inbox-pending-count"],
    queryFn: async () => {
      const inbox = await apiFetch("/inbox").then((r) => r.json()) as { status: string }[];
      return inbox.filter((i) => i.status === "pending").length;
    },
    refetchInterval: 60000,
  });

  const linkClass = (href: string, isMoreItem = false) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
      pathname === href
        ? "bg-primary/15 text-primary font-medium shadow-[inset_0_0_0_1px_var(--primary)]"
        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5",
      isMoreItem && "ml-0"
    );

  return (
    <aside className="w-56 h-screen border-r border-sidebar-border bg-sidebar flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            数字大脑
          </span>
        </Link>
        <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 tracking-wider uppercase">
          Knowledge Cave
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 pt-3 space-y-0.5">
        {coreItems.map((item) => (
          <Link key={item.href} to={item.href} className={linkClass(item.href)}>
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.href === "/inbox" && pendingCount !== undefined && pendingCount > 0 && (
              <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium tabular-nums">{pendingCount}</span>
            )}
          </Link>
        ))}

        <div className="my-1 mx-3 border-t border-sidebar-border/50" />

        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full transition-all duration-200",
            isInMore
              ? "bg-primary/10 text-primary font-medium"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-white/5"
          )}
        >
          <span className="text-base w-5 text-center">
            {showMore ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <span>更多</span>
        </button>

        {showMore && (
          <div className="ml-5 border-l border-sidebar-border/50 pl-2 space-y-0.5 pt-0.5">
            {moreItems.map((item) => (
              <Link key={item.href} to={item.href} className={linkClass(item.href, true)}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="text-[13px]">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
            pathname === "/settings"
              ? "bg-primary/15 text-primary font-medium shadow-[inset_0_0_0_1px_var(--primary)]"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5"
          )}
        >
          <span className="text-base w-5 text-center">⚙️</span>
          <span>设置</span>
        </Link>
        <div className="mt-2 pt-2 border-t border-sidebar-border/50">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="text-sm">🧝</span>
              <span className="absolute inset-0 rounded-full animate-[yinyue-pulse_3s_ease-in-out_infinite] bg-primary/20" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-sidebar-foreground/70 font-medium">银月</span>
              <span className="text-[9px] text-sidebar-foreground/40">洞府管家</span>
            </div>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
