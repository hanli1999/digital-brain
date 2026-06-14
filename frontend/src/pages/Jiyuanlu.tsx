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
import type { Jiyuanlu } from "@/types/api";

export default function JiyuanluPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [tags, setTags] = useState("");
  const [relatedMethod, setRelatedMethod] = useState("");

  const { data: items = [], isLoading } = useQuery<Jiyuanlu[]>({
    queryKey: ["jiyuanlu"],
    queryFn: () => apiFetch(`/jiyuanlu`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/jiyuanlu`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jiyuanlu"] }); setShowNew(false); setDetail(""); setDescription(""); setAction(""); setTags(""); setRelatedMethod(""); toast.success("已记录机缘"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/jiyuanlu/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jiyuanlu"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/jiyuanlu/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jiyuanlu"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = items.find((m) => m.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">机缘录</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 记录机缘</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>记录机缘</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="详情 *" value={detail} onChange={(e) => setDetail(e.target.value)} />
              <Textarea placeholder="描述" className="min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="行动" value={action} onChange={(e) => setAction(e.target.value)} />
              <Input placeholder="标签（逗号分隔）" value={tags} onChange={(e) => setTags(e.target.value)} />
              <Input placeholder="关联方法" value={relatedMethod} onChange={(e) => setRelatedMethod(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ detail, description, action, tags: JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)), relatedMethod })} disabled={createMutation.isPending || !detail}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState title="机缘录为空" description="从收件箱入库或手动记录关键事件" actionLabel="记录机缘" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "detail", header: "详情", cell: (m) => <span className="font-medium whitespace-nowrap">{toStr(m.detail)}</span>, className: "min-w-[140px]" },
            { key: "status", header: "状态", cell: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(m.status) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "description", header: "描述", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{toStr(m.description) || "-"}</span>, className: "max-w-[200px]" },
            { key: "action", header: "行动", cell: (m) => { const a = toStr(m.action); return a ? <Badge variant="secondary" className="text-xs">{a}</Badge> : <span className="text-muted-foreground text-xs">-</span>; }, className: "whitespace-nowrap" },
            { key: "tags", header: "标签", cell: (m) => { try { return (JSON.parse(m.tags || "[]") as string[]).map((t: string) => <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded mr-1 whitespace-nowrap">{t}</span>); } catch { return <span className="text-muted-foreground text-xs">-</span>; } }, className: "max-w-[160px]" },
            { key: "createdAt", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(m.createdAt)}</span>, className: "whitespace-nowrap" },
          ]}
          data={items} onRowClick={(m) => setSelectedId(m.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无机缘"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={toStr(selected?.detail) || "机缘详情"}
        editFields={selected ? [
          { key: "detail", label: "详情", value: toStr(selected.detail) },
          { key: "description", label: "描述", value: toStr(selected.description), type: "textarea" },
          { key: "status", label: "状态", value: toStr(selected.status) },
          { key: "action", label: "行动", value: toStr(selected.action) },
          { key: "tags", label: "标签", value: toStr(selected.tags) },
          { key: "relatedMethod", label: "关联方法", value: toStr(selected.relatedMethod) },
          { key: "actionLog", label: "操作日志", value: toStr(selected.actionLog), type: "textarea" },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-5">
            <div className="space-y-3">
              <FieldRow label="详情" value={toStr(selected.detail)} />
              <FieldRow label="状态" value={toStr(selected.status)} />
              <FieldRow label="行动" value={toStr(selected.action)} badge />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <FieldRow label="描述" value={toStr(selected.description)} block />
            </div>
            <div className="border-t border-border/30 pt-4 space-y-3">
              <FieldRow label="标签" value={toStr(selected.tags)} tags />
              <FieldRow label="关联方法" value={toStr(selected.relatedMethod)} />
              <FieldRow label="操作日志" value={toStr(selected.actionLog)} block />
              <FieldRow label="记录ID" value={toStr(selected.recordId)} />
            </div>
            <div className="border-t border-border/30 pt-4">
              <FieldRow label="创建时间" value={selected.createdAt} date />
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
