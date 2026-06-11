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
import { toStr, safeDate } from "@/lib/utils";
import type { Document } from "@/types/api";

const typeLabels: Record<string, string> = { paper: "论文", book: "书籍", article: "文章", doc: "文档", other: "其他" };

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [type, setType] = useState("other");
  const [importance, setImportance] = useState("");

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ["library"],
    queryFn: () => apiFetch(`/library`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/library`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["library"] }); setShowNew(false); setTitle(""); setAuthor(""); setUrl(""); setAbstract(""); setKeywords(""); setType("other"); setImportance(""); toast.success("已添加文献"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/library/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["library"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/library/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["library"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = docs.find((d) => d.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{docs.length} 篇文献</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 添加文献</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>添加文献</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="作者" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <Input placeholder="链接 URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Textarea placeholder="摘要" className="min-h-[120px]" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
              <Input placeholder="关键词（逗号分隔）" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              <select className="w-full border rounded p-2 text-sm bg-background" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="other">其他</option><option value="paper">论文</option><option value="book">书籍</option><option value="article">文章</option><option value="doc">文档</option>
              </select>
              <Input placeholder="重要程度" value={importance} onChange={(e) => setImportance(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, author, url, abstract, keywords: JSON.stringify(keywords.split(",").map((k) => k.trim()).filter(Boolean)), type, importance })} disabled={createMutation.isPending || !title}>添加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {docs.length === 0 ? (
        <EmptyState title="文献库为空" description="从收件箱入库或手动添加文献" actionLabel="添加文献" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (d) => <span className="font-medium line-clamp-1 max-w-[200px]">{toStr(d.title)}</span>, className: "min-w-[160px] max-w-[200px]" },
            { key: "author", header: "作者", cell: (d) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(d.author) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "type", header: "类型", cell: (d) => <Badge variant="secondary" className="text-xs">{typeLabels[toStr(d.type) || ""] || toStr(d.type) || "-"}</Badge>, className: "whitespace-nowrap" },
            { key: "importance", header: "重要度", cell: (d) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(d.importance) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "status", header: "状态", cell: (d) => <span className="text-xs text-muted-foreground whitespace-nowrap">{toStr(d.status) || "-"}</span>, className: "whitespace-nowrap" },
            { key: "abstract", header: "摘要", cell: (d) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[250px]">{toStr(d.abstract) || "-"}</span>, className: "max-w-[250px]" },
            { key: "createdAt", header: "时间", cell: (d) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(d.createdAt)}</span>, className: "whitespace-nowrap" },
          ]}
          data={docs} onRowClick={(d) => setSelectedId(d.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无文献"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={toStr(selected?.title) || "详情"}
        editFields={selected ? [
          { key: "title", label: "标题", value: toStr(selected.title) },
          { key: "author", label: "作者", value: toStr(selected.author) },
          { key: "url", label: "链接", value: toStr(selected.url) },
          { key: "abstract", label: "摘要", value: toStr(selected.abstract), type: "textarea" },
          { key: "keywords", label: "关键词", value: toStr(selected.keywords) },
          { key: "type", label: "类型", value: toStr(selected.type) },
          { key: "importance", label: "重要度", value: toStr(selected.importance) },
          { key: "status", label: "状态", value: toStr(selected.status) },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">标题</p><p className="text-sm font-medium">{toStr(selected.title)}</p></div>
            {toStr(selected.author) && <div><p className="text-xs text-muted-foreground mb-0.5">作者</p><p className="text-xs">{toStr(selected.author)}</p></div>}
            {toStr(selected.url) && <div><p className="text-xs text-muted-foreground mb-0.5">链接</p><a href={toStr(selected.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-xs">{toStr(selected.url)}</a></div>}
            {toStr(selected.type) && <div><p className="text-xs text-muted-foreground mb-0.5">类型</p><Badge variant="secondary" className="text-xs">{typeLabels[toStr(selected.type)] || toStr(selected.type)}</Badge></div>}
            {toStr(selected.importance) && <div><p className="text-xs text-muted-foreground mb-0.5">重要度</p><p className="text-xs">{toStr(selected.importance)}</p></div>}
            {toStr(selected.status) && <div><p className="text-xs text-muted-foreground mb-0.5">状态</p><p className="text-xs">{toStr(selected.status)}</p></div>}
            {toStr(selected.keywords) && <div><p className="text-xs text-muted-foreground mb-0.5">关键词</p><p className="text-xs">{toStr(selected.keywords)}</p></div>}
            {toStr(selected.abstract) && <div><p className="text-xs text-muted-foreground mb-0.5">摘要</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{toStr(selected.abstract)}</p></div>}
            {toStr(selected.snippet) && <div><p className="text-xs text-muted-foreground mb-0.5">片段</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{toStr(selected.snippet)}</p></div>}
            {selected.publishedAt && <div><p className="text-xs text-muted-foreground mb-0.5">发布日期</p><p className="text-xs">{toStr(selected.publishedAt)}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">添加时间</p><p className="text-xs">{safeDate(selected.createdAt, "datetime")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
