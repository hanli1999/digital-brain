import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import type { Resource } from "@/types/api";

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState("");

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: () => apiFetch(`/resources`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/resources`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resources"] }); setShowNew(false); setName(""); setUrl(""); setType(""); setStock(""); setStatus(""); setDetail(""); toast.success("已添加资源"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/resources/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resources"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/resources/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resources"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = resources.find((r) => r.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{resources.length} 项资源</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 添加资源</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>添加资源</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="资源名称 *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="链接 URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Input placeholder="类型" value={type} onChange={(e) => setType(e.target.value)} />
              <Input placeholder="存量" value={stock} onChange={(e) => setStock(e.target.value)} />
              <Input placeholder="状态" value={status} onChange={(e) => setStatus(e.target.value)} />
              <Textarea placeholder="详情" value={detail} onChange={(e) => setDetail(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, url, type, stock, status, detail })} disabled={createMutation.isPending || !name}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <EmptyState title="暂无资源" description="点击上方按钮添加第一项资源" />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "名称", cell: (r) => <span className="font-medium whitespace-nowrap">{r.name}</span>, className: "min-w-[120px]" },
            { key: "url", header: "链接", cell: (r) => r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[180px] block text-xs" onClick={(e) => e.stopPropagation()}>{r.url}</a> : <span className="text-muted-foreground text-xs">-</span>, className: "max-w-[180px]" },
            { key: "type", header: "类型", cell: (r) => r.type ? <Badge variant="secondary" className="text-xs">{r.type}</Badge> : <span className="text-muted-foreground text-xs">-</span>, className: "whitespace-nowrap" },
            { key: "stock", header: "存量", cell: (r) => <span className="text-xs text-muted-foreground whitespace-nowrap">{r.stock || "-"}</span>, className: "whitespace-nowrap" },
            { key: "status", header: "状态", cell: (r) => <span className="text-xs text-muted-foreground whitespace-nowrap">{r.status || "-"}</span>, className: "whitespace-nowrap" },
            { key: "detail", header: "详情", cell: (r) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{r.detail || "-"}</span>, className: "max-w-[200px]" },
          ]}
          data={resources} onRowClick={(r) => setSelectedId(r.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无资源"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.name || "详情"}
        editFields={selected ? [
          { key: "name", label: "名称", value: selected.name || "" },
          { key: "url", label: "链接", value: selected.url || "" },
          { key: "type", label: "类型", value: selected.type || "" },
          { key: "stock", label: "存量", value: selected.stock || "" },
          { key: "status", label: "状态", value: selected.status || "" },
          { key: "detail", label: "详情", value: selected.detail || "", type: "textarea" },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">名称</p><p className="text-sm font-medium">{selected.name}</p></div>
            {selected.url && <div><p className="text-xs text-muted-foreground mb-0.5">链接</p><a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-xs">{selected.url}</a></div>}
            {selected.type && <div><p className="text-xs text-muted-foreground mb-0.5">类型</p><Badge variant="secondary" className="text-xs">{selected.type}</Badge></div>}
            {selected.stock && <div><p className="text-xs text-muted-foreground mb-0.5">存量</p><p className="text-xs">{selected.stock}</p></div>}
            {selected.status && <div><p className="text-xs text-muted-foreground mb-0.5">状态</p><p className="text-xs">{selected.status}</p></div>}
            {selected.detail && <div><p className="text-xs text-muted-foreground mb-0.5">详情</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{selected.detail}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">创建时间</p><p className="text-xs">{new Date(selected.createdAt).toLocaleString("zh-CN")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
