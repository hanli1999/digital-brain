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
import { Magic1Line, Loading3Line, LayoutGridLine, ListCheckLine } from "@mingcute/react";
import { stripMarkdown, safeDate } from "@/lib/utils";
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
      const items = data.parsed || (data.title ? [data] : []);
      if (items.length === 0) { toast.error("AI 未能识别有效内容"); return; }
      setParsed(items[0]);
      if (items.length > 1) toast.info(`AI 识别到 ${items.length} 个独立条目，当前仅展示第一条`);
    } catch {
      toast.error("AI 解析失败，请重试");
    } finally {
      setParsing(false);
    }
  };

  // 一键入库：先创建收件箱条目，再自动路由到目标模块
  const autoRouteMutation = useMutation({
    mutationFn: async (parsed: ParsedCard) => {
      // 1. 创建收件箱条目
      const inboxR = await apiFetch("/inbox", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          content: parsed.abstract + (parsed.suggestion ? `\n\n建议：${parsed.suggestion}` : ""),
          tags: JSON.stringify(parsed.tags),
          status: "pending",
          routeTarget: parsed.routeTarget,
          source: "manual",
        }),
      });
      const inboxItem = await inboxR.json() as { id: string };
      // 2. 自动路由到目标模块
      const routeR = await apiFetch(`/inbox/${inboxItem.id}/route`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeTarget: parsed.routeTarget }),
      });
      return routeR.json() as Promise<{ targetLabel: string }>;
    },
    onSuccess: (data: { targetLabel: string }) => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setNlInput(""); setParsed(null);
      toast.success(`已自动入库到${data.targetLabel || "目标模块"}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "入库失败");
    },
  });

  const handleConfirmParsed = () => {
    if (!parsed) return;
    autoRouteMutation.mutate(parsed);
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
      <div className="mb-4 p-4 border border-primary/10 rounded-xl bg-linear-to-b from-card to-primary/3">
        <div className="flex gap-2">
          <Textarea
            placeholder="直接输入... 比如：'今天看到一个不错的AI视频剪辑工具，叫剪映专业版，支持自动字幕和多轨道编辑'"
            value={nlInput}
            onChange={(e) => { setNlInput(e.target.value); setParsed(null); }}
            className="min-h-[48px] text-sm border-primary/10 focus-visible:ring-primary/30"
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
          />
          <Button
            size="sm"
            onClick={handleParse}
            disabled={parsing || !nlInput.trim()}
            className="shrink-0 shadow-[0_0_12px_var(--primary)]/20"
          >
            {parsing ? <Loading3Line className="h-4 w-4 animate-spin" /> : <Magic1Line className="h-4 w-4" />}
            <span className="ml-1">{parsing ? "解析中..." : "AI 解析"}</span>
          </Button>
        </div>

        {parsed && (
          <div className="mt-3 p-4 border border-primary/10 rounded-xl bg-card space-y-2 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base text-foreground">{parsed.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">分类：{parsed.category}</span>
                <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium border border-primary/20">权重 10</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">{parsed.abstract}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {parsed.tags.map((t) => (
                <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-full border border-border/50">{t}</span>
              ))}
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground">心情：{parsed.mood}</span>
              <span className="text-xs text-muted-foreground">→ 归库：{parsed.routeTarget}</span>
            </div>
            <p className="text-xs text-accent-foreground/80">{parsed.suggestion}</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleConfirmParsed} disabled={autoRouteMutation.isPending} className="shadow-[0_0_12px_var(--primary)]/20">
                {autoRouteMutation.isPending ? "入库中..." : `一键入库 → ${parsed.routeTarget}`}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setParsed(null)}>重新输入</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <FilterPanel tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-sm transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <ListCheckLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-sm transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <LayoutGridLine className="h-4 w-4" />
          </button>
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
              className="cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-primary/20 transition-all duration-200 border-border/50 bg-linear-to-b from-card to-card/95 group"
              onClick={() => setSelectedId(item.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-medium text-sm line-clamp-2 group-hover:text-foreground transition-colors">{item.title}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed">{stripMarkdown(item.content)}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { try { return (JSON.parse(item.tags) as string[]).slice(0, 3); } catch { return []; } })().map((t: string) => (
                    <span key={t} className="text-xs bg-muted/80 px-1.5 py-0.5 rounded-full border border-border/30">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                  <span>{item.source === "manual" ? "手动" : item.source === "feishu-bot" ? "飞书机器人" : "飞书导入"}</span>
                  <span>{safeDate(item.createdAt)}</span>
                </div>
                {item.status === "pending" && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <RouteButton inboxId={item.id} title={item.title} content={item.content} aiTarget={item.routeTarget} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (i: InboxItem) => <span className="font-medium line-clamp-1 max-w-[180px]">{i.title}</span>, className: "min-w-[140px] max-w-[180px]" },
            { key: "mood", header: "心情", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground whitespace-nowrap">{i.mood || "-"}</span>, className: "whitespace-nowrap" },
            { key: "aiSummary", header: "AI 摘要", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{stripMarkdown(i.aiSummary || "") || "-"}</span>, className: "max-w-[180px]" },
            { key: "source", header: "来源", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground whitespace-nowrap">{i.source === "manual" ? "手动" : i.source === "feishu-bot" ? "飞书机器人" : "飞书导入"}</span>, className: "whitespace-nowrap" },
            { key: "status", header: "状态", cell: (i: InboxItem) => <StatusBadge status={i.status} />, className: "whitespace-nowrap" },
            { key: "createdAt", header: "时间", cell: (i: InboxItem) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(i.createdAt)}</span>, className: "whitespace-nowrap" },
            { key: "actions", header: "操作", cell: (i: InboxItem) => i.status === "pending" ? <RouteButton inboxId={i.id} title={i.title} content={i.content} aiTarget={i.routeTarget} /> : <span className="text-xs text-muted-foreground">→ {i.routeTarget}</span>, className: "whitespace-nowrap" },
          ]}
          data={filteredItems}
          onRowClick={(i) => setSelectedId(i.id)}
          onDelete={(id) => deleteMutation.mutate(id)}
          emptyMessage="暂无条目"
        />
      )}

      <DetailSheet open={!!selectedItem} onOpenChange={() => setSelectedId(null)} title={selectedItem?.title || "详情"}>
        {selectedItem && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedItem.status} />
              {selectedItem.mood && <span className="text-xs text-muted-foreground">心情：{selectedItem.mood}</span>}
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">{selectedItem.content}</p>
            {selectedItem.aiSummary && <div><p className="text-xs text-muted-foreground mb-0.5">AI 摘要</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{selectedItem.aiSummary}</p></div>}
            {selectedItem.sourceUrl && <div><p className="text-xs text-muted-foreground mb-0.5">来源链接</p><a href={selectedItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-xs">{selectedItem.sourceUrl}</a></div>}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><span className="block mb-0.5">来源</span><span>{selectedItem.source === "manual" ? "手动" : selectedItem.source === "feishu-bot" ? "飞书机器人" : "飞书导入"}</span></div>
              {selectedItem.routeTarget && <div><span className="block mb-0.5">入库目标</span><span>{selectedItem.routeTarget}</span></div>}
              {selectedItem.routedTo && <div><span className="block mb-0.5">已入库至</span><span>{selectedItem.routedTo}</span></div>}
              {selectedItem.collectedAt && <div><span className="block mb-0.5">采集时间</span><span>{selectedItem.collectedAt}</span></div>}
            </div>
            <p className="text-xs text-muted-foreground">创建于 {safeDate(selectedItem.createdAt, "datetime")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
