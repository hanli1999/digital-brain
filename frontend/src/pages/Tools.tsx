import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { FieldRow } from "@/components/shared/FieldRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import { toStr, safeDate } from "@/lib/utils";
import type { Tool } from "@/types/api";

// 飞书API字段值可能是对象 {text, link} 而非纯字符串，toStr归一化
const categoryColors: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  design: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  productivity: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  ai: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  other: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

export default function ToolsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("other");
  const [corePower, setCorePower] = useState("");
  const [initScript, setInitScript] = useState("");
  const [rating, setRating] = useState("");
  const [record, setRecord] = useState("");

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: () => apiFetch(`/tools`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/tools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tools"] }); setShowNew(false); setName(""); setUrl(""); setCategory("other"); setCorePower(""); setInitScript(""); setRating(""); setRecord(""); toast.success("已添加工具"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/tools/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tools"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/tools/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tools"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = tools.find((t) => t.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{tools.length} 个工具</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建工具</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>新建工具</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="工具名称 *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="链接 URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <select className="w-full border rounded p-2 text-sm bg-background" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="other">其他</option><option value="dev">开发</option><option value="design">设计</option><option value="productivity">效率</option><option value="ai">AI</option>
              </select>
              <Textarea placeholder="核心能力" value={corePower} onChange={(e) => setCorePower(e.target.value)} />
              <Textarea placeholder="初始化脚本" value={initScript} onChange={(e) => setInitScript(e.target.value)} />
              <Input placeholder="评分" value={rating} onChange={(e) => setRating(e.target.value)} />
              <Textarea placeholder="使用记录" value={record} onChange={(e) => setRecord(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, url, category, corePower, initScript, rating, record })} disabled={createMutation.isPending || !name}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tools.length === 0 ? (
        <EmptyState title="工具箱为空" description="从收件箱入库或手动添加工具" actionLabel="新建工具" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "名称", cell: (t: Tool) => <span className="font-medium whitespace-nowrap">{toStr(t.name)}</span>, className: "min-w-[120px]" },
            { key: "url", header: "链接", cell: (t: Tool) => { const u = toStr(t.url); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[180px] block text-xs" onClick={(e) => e.stopPropagation()}>{u}</a> : <span className="text-muted-foreground text-xs">-</span>; }, className: "max-w-[180px]" },
            { key: "category", header: "分类", cell: (t: Tool) => { const c = toStr(t.category) || "other"; return <Badge variant="secondary" className={`text-xs ${categoryColors[c] || categoryColors.other}`}>{c}</Badge>; }, className: "whitespace-nowrap" },
            { key: "corePower", header: "核心能力", cell: (t: Tool) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">{toStr(t.corePower) || "-"}</span>, className: "max-w-[180px]" },
            { key: "rating", header: "评分", cell: (t: Tool) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(t.rating) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "record", header: "使用记录", cell: (t: Tool) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">{toStr(t.record) || "-"}</span>, className: "max-w-[180px]" },
            { key: "createdAt", header: "时间", cell: (t: Tool) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(t.createdAt)}</span>, className: "whitespace-nowrap" },
          ]}
          data={tools} onRowClick={(t) => setSelectedId(t.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无工具"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={toStr(selected?.name) || "详情"}
        editFields={selected ? [
          { key: "name", label: "名称", value: toStr(selected.name) },
          { key: "url", label: "链接", value: toStr(selected.url) },
          { key: "category", label: "分类", value: toStr(selected.category) },
          { key: "corePower", label: "核心能力", value: toStr(selected.corePower), type: "textarea" as const },
          { key: "initScript", label: "初始化脚本", value: toStr(selected.initScript), type: "textarea" as const },
          { key: "rating", label: "评分", value: toStr(selected.rating) },
          { key: "record", label: "使用记录", value: toStr(selected.record), type: "textarea" as const },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-5">
            <div className="space-y-3">
              <FieldRow label="名称" value={toStr(selected.name)} />
              <FieldRow label="链接" value={toStr(selected.url)} link />
              <FieldRow label="分类" value={toStr(selected.category)} badge badgeClass={categoryColors[toStr(selected.category) || "other"]} />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <FieldRow label="核心能力" value={toStr(selected.corePower)} block />
              <FieldRow label="初始化脚本" value={toStr(selected.initScript)} block />
              <FieldRow label="使用记录" value={toStr(selected.record)} block />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <FieldRow label="评分" value={toStr(selected.rating)} />
              <FieldRow label="创建时间" value={selected.createdAt} date />
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
