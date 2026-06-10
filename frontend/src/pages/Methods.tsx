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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config/api";
import type { Method } from "@/types/api";

export default function MethodsPage() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const { data: methods = [], isLoading } = useQuery<Method[]>({
    queryKey: ["methods"],
    queryFn: () => fetch(`${API_BASE_URL}/methods`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; tags: string }) =>
      fetch(`${API_BASE_URL}/methods`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["methods"] }); setShowNew(false); setTitle(""); setContent(""); setTags(""); toast.success("已添加方法"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API_BASE_URL}/methods/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["methods"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = methods.find((m) => m.id === selectedId);
  const filtered = activeTag ? methods.filter((m) => { try { return JSON.parse(m.tags).includes(activeTag); } catch { return false; } }) : methods;
  const allTags = Array.from(new Set(methods.flatMap((m) => { try { return JSON.parse(m.tags); } catch { return []; } }))) as string[];
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <FilterPanel tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建方法</DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>新建方法</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="内容（Markdown）" className="min-h-[300px] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
              <Input placeholder="标签（逗号分隔）" value={tags} onChange={(e) => setTags(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, content, tags: JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)) })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="方法库为空" description="从收件箱入库或手动添加工作方法" actionLabel="新建方法" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (m) => <span className="font-medium">{m.title}</span> },
            { key: "tags", header: "标签", cell: (m) => { try { return (JSON.parse(m.tags) as string[]).map((t: string) => <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded mr-1">{t}</span>); } catch { return null; } } },
            { key: "createdAt", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</span> },
          ]}
          data={filtered} onRowClick={(m) => setSelectedId(m.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无方法"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.title || "详情"}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">{selected.content}</div>
            <p className="text-xs text-muted-foreground">创建于 {new Date(selected.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
