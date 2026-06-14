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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import { safeDate, toStr } from "@/lib/utils";
import type { Insight } from "@/types/api";

export default function InsightPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");

  const { data: items = [], isLoading } = useQuery<Insight[]>({
    queryKey: ["insight"],
    queryFn: () => apiFetch(`/insight`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: string; source: string }) =>
      apiFetch(`/insight`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["insight"] }); setShowNew(false); setTitle(""); setContent(""); setCategory(""); setSource(""); toast.success("已添加洞察"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/insight/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["insight"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/insight/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["insight"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = items.find((i) => i.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{items.length} 条洞察</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建洞察</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建洞察</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="分类（如：灵感、观察、反思）" value={category} onChange={(e) => setCategory(e.target.value)} />
              <Input placeholder="来源（如：阅读、对话、思考）" value={source} onChange={(e) => setSource(e.target.value)} />
              <Textarea placeholder="内容" className="min-h-[150px]" value={content} onChange={(e) => setContent(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, content, category, source })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState title="洞察为空" description="记录灵感、观察和反思，从收件箱入库或手动添加" actionLabel="新建洞察" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (d: Insight) => <span className="font-medium">{d.title}</span> },
            { key: "category", header: "分类", cell: (d: Insight) => <span className="text-xs text-muted-foreground">{d.category || "-"}</span> },
            { key: "source", header: "来源", cell: (d: Insight) => <span className="text-xs text-muted-foreground">{d.source || "-"}</span> },
            { key: "createdAt", header: "时间", cell: (d: Insight) => <span className="text-xs text-muted-foreground">{safeDate(d.createdAt)}</span> },
          ]}
          data={items} onRowClick={(d) => setSelectedId(d.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无洞察"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.title || "详情"}
        editFields={selected ? [
          { key: "title", label: "标题", value: selected.title },
          { key: "content", label: "内容", value: selected.content, type: "textarea" },
          { key: "category", label: "分类", value: selected.category },
          { key: "source", label: "来源", value: selected.source },
          { key: "tags", label: "标签", value: selected.tags },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <FieldRow label="分类" value={selected.category} badge />
              <FieldRow label="来源" value={selected.source} />
            </div>
            <div className="border-t border-border/30 pt-4">
              <FieldRow label="内容" value={selected.content} block />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <FieldRow label="标签" value={selected.tags} tags />
              <FieldRow label="创建时间" value={selected.createdAt} date />
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
