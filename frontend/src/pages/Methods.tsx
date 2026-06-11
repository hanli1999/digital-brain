import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import { toStr, safeDate } from "@/lib/utils";
import type { Method } from "@/types/api";

export default function MethodsPage() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [essence, setEssence] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [related, setRelated] = useState("");
  const [storage, setStorage] = useState("");

  const { data: methods = [], isLoading } = useQuery<Method[]>({
    queryKey: ["methods"],
    queryFn: () => apiFetch(`/methods`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/methods`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["methods"] }); setShowNew(false); setTitle(""); setEssence(""); setType(""); setTags(""); setRelated(""); setStorage(""); toast.success("已添加方法"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/methods/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["methods"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/methods/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["methods"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = methods.find((m) => m.id === selectedId);
  const filtered = activeTag ? methods.filter((m) => { try { return JSON.parse(m.tags || "[]").includes(activeTag); } catch { return false; } }) : methods;
  const allTags = Array.from(new Set(methods.flatMap((m) => { try { return JSON.parse(m.tags || "[]"); } catch { return []; } }))) as string[];
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <FilterPanel tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建方法</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>新建方法</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="精髓 / 核心内容" className="min-h-[150px]" value={essence} onChange={(e) => setEssence(e.target.value)} />
              <Input placeholder="类型" value={type} onChange={(e) => setType(e.target.value)} />
              <Input placeholder="标签（逗号分隔）" value={tags} onChange={(e) => setTags(e.target.value)} />
              <Input placeholder="相关方法" value={related} onChange={(e) => setRelated(e.target.value)} />
              <Input placeholder="存储位置" value={storage} onChange={(e) => setStorage(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, essence, type, tags: JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)), related, storage })} disabled={createMutation.isPending || !title}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="方法库为空" description="从收件箱入库或手动添加工作方法" actionLabel="新建方法" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (m) => <span className="font-medium whitespace-nowrap">{toStr(m.title)}</span>, className: "min-w-[140px]" },
            { key: "type", header: "类型", cell: (m) => { const t = toStr(m.type); return t ? <Badge variant="secondary" className="text-xs">{t}</Badge> : <span className="text-muted-foreground text-xs">-</span>; }, className: "whitespace-nowrap" },
            { key: "status", header: "状态", cell: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(m.status) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "essence", header: "精髓", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]">{toStr(m.essence) || "-"}</span>, className: "max-w-[220px]" },
            { key: "tags", header: "标签", cell: (m) => { try { return (JSON.parse(m.tags || "[]") as string[]).map((t: string) => <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded mr-1 whitespace-nowrap">{t}</span>); } catch { return <span className="text-muted-foreground text-xs">-</span>; } }, className: "max-w-[200px]" },
            { key: "createdAt", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(m.createdAt)}</span>, className: "whitespace-nowrap" },
          ]}
          data={filtered} onRowClick={(m) => setSelectedId(m.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无方法"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={toStr(selected?.title) || "详情"}
        editFields={selected ? [
          { key: "title", label: "标题", value: toStr(selected.title) },
          { key: "essence", label: "精髓", value: toStr(selected.essence), type: "textarea" },
          { key: "type", label: "类型", value: toStr(selected.type) },
          { key: "status", label: "状态", value: toStr(selected.status) },
          { key: "tags", label: "标签", value: toStr(selected.tags) },
          { key: "related", label: "相关方法", value: toStr(selected.related) },
          { key: "storage", label: "存储位置", value: toStr(selected.storage) },
          { key: "learnedDate", label: "学习日期", value: toStr(selected.learnedDate) },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">标题</p><p className="text-sm font-medium">{toStr(selected.title)}</p></div>
            {toStr(selected.type) && <div><p className="text-xs text-muted-foreground mb-0.5">类型</p><Badge variant="secondary" className="text-xs">{toStr(selected.type)}</Badge></div>}
            {toStr(selected.status) && <div><p className="text-xs text-muted-foreground mb-0.5">状态</p><p className="text-xs">{toStr(selected.status)}</p></div>}
            {toStr(selected.essence) && <div><p className="text-xs text-muted-foreground mb-0.5">精髓</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{toStr(selected.essence)}</p></div>}
            {toStr(selected.tags) && <div><p className="text-xs text-muted-foreground mb-0.5">标签</p><p className="text-xs">{toStr(selected.tags)}</p></div>}
            {toStr(selected.related) && <div><p className="text-xs text-muted-foreground mb-0.5">相关方法</p><p className="text-xs">{toStr(selected.related)}</p></div>}
            {toStr(selected.storage) && <div><p className="text-xs text-muted-foreground mb-0.5">存储位置</p><p className="text-xs">{toStr(selected.storage)}</p></div>}
            {toStr(selected.learnedDate) && <div><p className="text-xs text-muted-foreground mb-0.5">学习日期</p><p className="text-xs">{toStr(selected.learnedDate)}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">创建时间</p><p className="text-xs">{safeDate(selected.createdAt, "datetime")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
