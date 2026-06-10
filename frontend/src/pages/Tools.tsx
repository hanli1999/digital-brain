import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";
import type { Tool } from "@/types/api";

const categoryColors: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700", design: "bg-purple-100 text-purple-700",
  productivity: "bg-green-100 text-green-700", ai: "bg-orange-100 text-orange-700",
  other: "bg-neutral-100 text-neutral-700",
};

export default function ToolsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("other");
  const [url, setUrl] = useState("");

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: () => fetch(`${API_BASE_URL}/tools`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; category: string; url: string }) =>
      fetch(`${API_BASE_URL}/tools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tools"] }); setShowNew(false); setName(""); setDesc(""); setUrl(""); toast.success("已添加工具"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API_BASE_URL}/tools/${id}`, { method: "DELETE" }),
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
          <DialogContent>
            <DialogHeader><DialogTitle>新建工具</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="工具名称" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <Input placeholder="链接 URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <select className="w-full border rounded p-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="other">其他</option><option value="dev">开发</option><option value="design">设计</option><option value="productivity">效率</option><option value="ai">AI</option>
              </select>
              <Button onClick={() => createMutation.mutate({ name, description: desc, category, url })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tools.length === 0 ? (
        <EmptyState title="工具箱为空" description="从收件箱入库或手动添加工具" actionLabel="新建工具" onAction={() => setShowNew(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <div key={tool.id} className="p-4 rounded-lg border hover:shadow-sm cursor-pointer transition-shadow" onClick={() => setSelectedId(tool.id)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm">{tool.name}</h3>
                <Badge variant="secondary" className={categoryColors[tool.category] || categoryColors.other}>{tool.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
              {tool.url && <p className="text-xs text-blue-500 mt-1 truncate">{tool.url}</p>}
            </div>
          ))}
        </div>
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.name || "详情"} onDelete={selected ? () => deleteMutation.mutate(selected.id) : undefined}>
        {selected && (
          <div className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">{selected.description}</p>
            {selected.url && <p><span className="text-muted-foreground">链接：</span><a href={selected.url} target="_blank" rel="noreferrer" className="text-blue-500 underline">{selected.url}</a></p>}
            <Badge variant="secondary">{selected.category}</Badge>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
