"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["search", q],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
    enabled: q.length > 0,
  });

  const entityLabels: Record<string, string> = {
    inbox: "收件箱",
    task: "任务",
    tool: "工具",
    method: "方法",
    document: "文献",
    ai_mechanism: "AI机制",
  };

  if (!q) {
    return <p className="text-center text-muted-foreground py-12">输入关键词搜索</p>;
  }

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-12">搜索中...</p>;
  }

  if (results.length === 0) {
    return <p className="text-center text-muted-foreground py-12">未找到 &quot;{q}&quot; 的结果</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">找到 {results.length} 条结果</p>
      {results.map((r) => (
        <Link
          key={`${r.entityType}-${r.entityId}`}
          href={`/${r.entityType === "inbox" ? "inbox" : r.entityType === "document" ? "library" : r.entityType + "s"}`}
          className="block p-3 rounded-lg border hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {entityLabels[r.entityType] || r.entityType}
            </span>
            <span className="font-medium text-sm">{r.title}</span>
          </div>
          {r.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground py-12">加载中...</p>}>
      <SearchResults />
    </Suspense>
  );
}
