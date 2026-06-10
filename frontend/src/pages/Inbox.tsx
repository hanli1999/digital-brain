import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { RouteButton } from "@/components/inbox/RouteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import type { InboxItem } from "@/types/api";
import { Sparkles, Loader2, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const INTERNAL_TAGS = new Set([
  "数字洞府", "使用说明书", "今日收件箱", "机缘录", "功法库", "法器阁", "丹房",
  "AI字段", "炼化结果", "归位去处", "距今天数", "时间权重分",
]);

interface ParsedCard {
  title: string;
  category: string;
  tags: string[];
  routeTarget: string;
  mood: string;
  abstract: string;
  suggestion: string;
}

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [nlInput, setNlInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedCard | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const { data: items = [], isLoading } = useQuery<InboxItem[]>({
    queryKey: ["inbox"],
    queryFn: () => apiFetch(`/inbox`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; tags: string; status?: string; routeTarget?: string }) =>
      apiFetch(`/inbox`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "manual" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      setShowNewItem(false); setNewTitle(""); setNewContent(""); setNewTags("");
      setNlInput(""); setParsed(null);
      toast.success("已添加到收件箱");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/inbox/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      setSelectedId(null);
      toast.success("已删除");
    },
    onError: () => toast.error("删除失败"),
  });

  const handleParse = async () => {
    if (!nlInput.trim()) return;
    setParsing(true);
    try {
      const res = await apiFetch(`/ai/parse-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlInput }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setParsed(data);
    } catch {
      toast.error("AI 解析失败，请重试");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmParsed = () => {
    if (!parsed) return;
    createMutation.mutate({
      title: parsed.title,
      content: parsed.abstract + (parsed.suggestion ? `\n\n建议：${parsed.suggestion}` : ""),
      tags: JSON.stringify(parsed.tags),
      status: "pending",
      routeTarget: parsed.routeTarget,
    });
  };

  const selectedItem = items.find((i) => i.id === selectedId);
  const filteredItems = activeTag
    ? items.filter((i) => { try { return JSON.parse(i.tags).includes(activeTag); } catch { return false; } })
    : items;
  const allTags = Array.from(new Set(items.flatMap((i) => { try { return JSON.parse(i.tags); } catch { return []; } }))).filter((t) => !INTERNAL_TAGS.has(t as string)) as string[];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      {/* Natural Language Input */}
      <div className="mb-4 p-3 border rounded-lg bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            placeholder="直接输入... 比如：'今天看到一个不错的AI视频剪辑工具，叫剪映专业版，支持自动字幕和多轨道编辑'"
            value={nlInput}
            onChange={(e) => { setNlInput(e.target.value); setParsed(null); }}
            className="min-h-[48px] text-sm"
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
          />
          <Button
            size="sm"
            onClick={handleParse}
            disabled={parsing || !nlInput.trim()}
            className="shrink-0"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-1">{parsing ? "解析中..." : "AI 解析"}</span>
          </Button>
        </div>

        {parsed && (
          <div className="mt-3 p-3 border rounded-md bg-background space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base">{parsed.title}</span>
              <span className="text-xs text-muted-foreground">分类：{parsed.category}</span>
            </div>
            <p className="text-muted-foreground">{parsed.abstract}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {parsed.tags.map((t) => (
                <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-full">{t}</span>
              ))}
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs">心情：{parsed.mood}</span>
              <span className="text-xs">→ 归库：{parsed.routeTarget}</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">{parsed.suggestion}</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleConfirmParsed} disabled={createMutation.isPending}>
                {createMutation.isPending ? "加入中..." : "确认入库"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setParsed(null)}>重新输入</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <FilterPanel tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("card")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 高级新建</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建收件箱条目</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="标题" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Textarea placeholder="内容" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              <Input placeholder="标签（逗号分隔）" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title: newTitle, content: newContent, tags: JSON.stringify(newTags.split(",").map((t) => t.trim()).filter(Boolean)) })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState title="收件箱为空" description="在上方输入框直接用自然语言记录，AI 会自动分类" actionLabel="手动新建" onAction={() => setShowNewItem(true)} />
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => setSelectedId(item.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-medium text-sm line-clamp-2">{item.title}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { try { return (JSON.parse(item.tags) as string[]).slice(0, 3); } catch { return []; } })().map((t: string) => (
                    <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.source === "manual" ? "手动" : item.source === "feishu-bot" ? "飞书机器人" : "飞书导入"}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (i: InboxItem) => <span className="font-medium">{i.title}</span> },
            { key: "source", header: "来源", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground">{i.source === "manual" ? "手动" : i.source === "feishu-bot" ? "飞书机器人" : "飞书导入"}</span> },
            { key: "status", header: "状态", cell: (i: InboxItem) => <StatusBadge status={i.status} /> },
            { key: "createdAt", header: "时间", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString("zh-CN")}</span> },
            { key: "actions", header: "操作", cell: (i: InboxItem) => i.status === "pending" ? <RouteButton inboxId={i.id} title={i.title} content={i.content} /> : <span className="text-xs text-muted-foreground">→ {i.routeTarget}</span> },
          ]}
          data={filteredItems}
          onRowClick={(i) => setSelectedId(i.id)}
          onDelete={(id) => deleteMutation.mutate(id)}
          emptyMessage="暂无条目"
        />
      )}

      <DetailSheet open={!!selectedItem} onOpenChange={() => setSelectedId(null)} title={selectedItem?.title || "详情"}>
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">{selectedItem.content}</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedItem.status} />
              {selectedItem.routeTarget && <span className="text-xs">→ 已入库到 {selectedItem.routeTarget}</span>}
            </div>
            <p className="text-xs text-muted-foreground">创建于 {new Date(selectedItem.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
