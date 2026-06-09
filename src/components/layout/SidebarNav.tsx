"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inbox", label: "收件箱", icon: "📥" },
  { href: "/tasks", label: "任务板", icon: "📋" },
  { href: "/tools", label: "工具箱", icon: "🧰" },
  { href: "/analytics", label: "数据中心", icon: "📊" },
  { href: "/methods", label: "方法库", icon: "📖" },
  { href: "/ai-engine", label: "AI 引擎", icon: "🤖" },
  { href: "/library", label: "文献库", icon: "📚" },
  { href: "/files", label: "文件管理", icon: "📁" },
  { href: "/calendar", label: "日程", icon: "📅" },
  { href: "/search", label: "全局搜索", icon: "🔍" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen border-r bg-muted/30 flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b">
        <Link href="/" className="text-lg font-bold tracking-tight">
          数字大脑
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/settings"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-base">⚙️</span>
          <span>设置</span>
        </Link>
      </div>
    </aside>
  );
}
