import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import type { Metric } from "@/types/api";

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const { data: resources = [], isLoading } = useQuery<Metric[]>({
    queryKey: ["resources"],
    queryFn: () => apiFetch(`/resources`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; value: number; unit: string; category: string }) =>
      apiFetch(`/resources`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resources"] }); setShowNew(false); setName(""); setValue(""); setUnit(""); setCategory(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/resources/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resources"] }),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{resources.length} 项资源</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 添加资源</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加资源</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="资源名称" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="存量" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
              <Input placeholder="单位" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input placeholder="分类" value={category} onChange={(e) => setCategory(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, value: Number(value) || 0, unit, category })} disabled={!name}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {resources.length === 0 ? (
        <EmptyState title="暂无资源" description="点击上方按钮添加第一项资源" />
      ) : (
        <DataTable
          data={resources}
          columns={[
            { key: "name", header: "名称", cell: (r: Metric) => <span className="font-medium">{r.name}</span> },
            { key: "value", header: "存量", cell: (r: Metric) => <span>{r.value}{r.unit}</span> },
            { key: "category", header: "分类", cell: (r: Metric) => <span>{r.category}</span> },
          ]}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
