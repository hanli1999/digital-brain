"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { RouteButton } from "@/components/inbox/RouteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InboxItem {
  id: string;
  title: string;
  content: string;
  source: string;
  status: string;
  routeTarget: string | null;
  tags: string;
  createdAt: string;
}

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  const { data: items = [], isLoading } = useQuery<InboxItem[]>({
    queryKey: ["inbox"],
    queryFn: () => fetch("/api/inbox").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; tags: string }) =>
      fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "manual" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      setShowNewItem(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
    },
  });

  const selectedItem = items.find((i) => i.id === selectedId);

  const filteredItems = activeTag
    ? items.filter((i) => {
        try {
          return JSON.parse(i.tags).includes(activeTag);
        } catch {
          return false;
        }
      })
    : items;

  const allTags = Array.from(
    new Set(
      items.flatMap((i) => {
        try {
          return JSON.parse(i.tags);
        } catch {
          return [];
        }
      })
    )
  ) as string[];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <FilterPanel tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
          <DialogTrigger asChild>
            <Button size="sm">+ 新建条目</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建收件箱条目</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="标题"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="内容"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <Input
                placeholder="标签（逗号分隔）"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <Button
                onClick={() =>
                  createMutation.mutate({
                    title: newTitle,
                    content: newContent,
                    tags: JSON.stringify(
                      newTags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    ),
                  })
                }
                disabled={createMutation.isPending}
              >
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="收件箱为空"
          description="点击右上角新建条目，或等待飞书消息自动导入"
          actionLabel="新建条目"
          onAction={() => setShowNewItem(true)}
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              header: "标题",
              cell: (i) => <span className="font-medium">{i.title}</span>,
            },
            {
              key: "source",
              header: "来源",
              cell: (i) => (
                <span className="text-xs text-muted-foreground">
                  {i.source === "manual"
                    ? "手动"
                    : i.source === "feishu-bot"
                    ? "飞书机器人"
                    : "飞书导入"}
                </span>
              ),
            },
            { key: "status", header: "状态", cell: (i) => <StatusBadge status={i.status} /> },
            {
              key: "createdAt",
              header: "时间",
              cell: (i) => (
                <span className="text-xs text-muted-foreground">
                  {new Date(i.createdAt).toLocaleDateString("zh-CN")}
                </span>
              ),
            },
            {
              key: "actions",
              header: "操作",
              cell: (i) =>
                i.status === "pending" ? (
                  <RouteButton inboxId={i.id} />
                ) : (
                  <span className="text-xs text-muted-foreground">→ {i.routeTarget}</span>
                ),
            },
          ]}
          data={filteredItems}
          onRowClick={(i) => setSelectedId(i.id)}
          emptyMessage="暂无条目"
        />
      )}

      <DetailSheet
        open={!!selectedItem}
        onOpenChange={() => setSelectedId(null)}
        title={selectedItem?.title || "详情"}
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {selectedItem.content}
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedItem.status} />
              {selectedItem.routeTarget && (
                <span className="text-xs">→ 已入库到 {selectedItem.routeTarget}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              创建于 {new Date(selectedItem.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
