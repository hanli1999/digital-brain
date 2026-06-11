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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";
import type { Task } from "@/types/api";

const statusLabels: Record<string, string> = { todo: "待办", in_progress: "进行中", done: "已完成" };
const statusColors: Record<string, string> = {
  todo: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};
const columns = [
  { key: "todo", label: "待办", color: "bg-neutral-50 dark:bg-neutral-900/50" },
  { key: "in_progress", label: "进行中", color: "bg-blue-50 dark:bg-blue-950/50" },
  { key: "done", label: "已完成", color: "bg-green-50 dark:bg-green-950/50" },
] as const;

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [action, setAction] = useState("");
  const [tags, setTags] = useState("");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiFetch(`/tasks`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); setShowNew(false); setTitle(""); setDesc(""); setAction(""); setTags(""); toast.success("已创建任务"); },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("状态已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = tasks.find((t) => t.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{tasks.length} 个任务</h2>
        <div className="flex gap-2">
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建任务</DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="任务标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)} />
                <Input placeholder="行动" value={action} onChange={(e) => setAction(e.target.value)} />
                <Input placeholder="标签（逗号分隔）" value={tags} onChange={(e) => setTags(e.target.value)} />
                <Button onClick={() => createMutation.mutate({ title, description: desc, action, tags: JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)) })} disabled={createMutation.isPending || !title}>创建</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="任务板为空" description="从收件箱入库或手动创建任务" actionLabel="新建任务" onAction={() => setShowNew(true)} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.key} className={`rounded-lg p-4 ${col.color}`}>
              <h3 className="text-sm font-semibold mb-3">{col.label} ({tasks.filter((t) => t.status === col.key).length})</h3>
              <div className="space-y-2">
                {tasks.filter((t) => t.status === col.key).map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-sm" onClick={() => setSelectedId(task.id)}>
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm">{task.title}</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-red-500 h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(task.id); }}>×</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                      {task.action && <p className="text-xs text-primary/70 mt-1">{task.action}</p>}
                      {task.tags && <div className="flex gap-1 mt-1">{(() => { try { return (JSON.parse(task.tags) as string[]).map((t: string) => <span key={t} className="text-[10px] bg-muted px-1 py-0.5 rounded">{t}</span>); } catch { return null; } })()}</div>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={`text-xs ${statusColors[task.status] || ""}`}>{statusLabels[task.status] || task.status}</Badge>
                        {col.key !== "done" && (
                          <Button variant="ghost" size="sm" className="text-xs ml-auto"
                            onClick={(e) => { e.stopPropagation(); moveMutation.mutate({ id: task.id, status: col.key === "todo" ? "in_progress" : "done" }); }}>
                            {col.key === "todo" ? "开始 →" : "完成 ✓"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.title || "详情"}
        editFields={selected ? [
          { key: "title", label: "标题", value: selected.title || "" },
          { key: "description", label: "描述", value: selected.description || "", type: "textarea" },
          { key: "action", label: "行动", value: selected.action || "" },
          { key: "status", label: "状态", value: selected.status || "" },
          { key: "tags", label: "标签", value: selected.tags || "" },
        ] : undefined}
        onSave={(data) => moveMutation.mutate({ id: selected!.id, status: data.status || selected!.status, ...data } as unknown as { id: string; status: string })}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">标题</p><p className="text-sm font-medium">{selected.title}</p></div>
            <div><p className="text-xs text-muted-foreground mb-0.5">状态</p><Badge variant="secondary" className={`text-xs ${statusColors[selected.status] || ""}`}>{statusLabels[selected.status] || selected.status}</Badge></div>
            {selected.description && <div><p className="text-xs text-muted-foreground mb-0.5">描述</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{selected.description}</p></div>}
            {selected.action && <div><p className="text-xs text-muted-foreground mb-0.5">行动</p><p className="text-xs">{selected.action}</p></div>}
            {selected.tags && <div><p className="text-xs text-muted-foreground mb-0.5">标签</p><p className="text-xs">{selected.tags}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">创建时间</p><p className="text-xs">{new Date(selected.createdAt).toLocaleString("zh-CN")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
