import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/config/api";
import type { Metric } from "@/types/api";

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const { data: metrics = [], isLoading } = useQuery<Metric[]>({
    queryKey: ["metrics"],
    queryFn: () => fetch(`${API_BASE_URL}/metrics`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; value: number; unit: string; category: string }) =>
      fetch(`${API_BASE_URL}/metrics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      setShowNew(false);
      setName("");
      setValue("");
      setUnit("");
      setCategory("");
      toast.success("已添加指标");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API_BASE_URL}/metrics/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["metrics"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const categories = Array.from(new Set(metrics.map((m) => m.category).filter(Boolean)));
  const totalByCat = categories.map((cat) => ({
    category: cat,
    count: metrics.filter((m) => m.category === cat).length,
  }));

  const selected = metrics.find((m) => m.id === selectedId);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{metrics.length} 条记录</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 添加指标</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加指标</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="指标名称" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="数值" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
              <Input placeholder="单位" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input placeholder="分类" value={category} onChange={(e) => setCategory(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, value: Number(value), unit, category })} disabled={createMutation.isPending}>添加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {totalByCat.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {totalByCat.map((cat) => (
            <Card key={cat.category}>
              <CardHeader className="p-3 pb-1"><CardTitle className="text-xs text-muted-foreground">{cat.category || "未分类"}</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0"><p className="text-xl font-bold">{cat.count}</p></CardContent>
            </Card>
          ))}
        </div>
      )}

      {metrics.length === 0 ? (
        <EmptyState title="暂无数据" description="添加量化指标跟踪工作数据" actionLabel="添加指标" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "名称", cell: (m) => <span className="font-medium text-sm">{m.name}</span> },
            { key: "value", header: "数值", cell: (m) => <span className="font-semibold">{m.value} <span className="text-xs text-muted-foreground">{m.unit}</span></span> },
            { key: "category", header: "分类", cell: (m) => <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{m.category || "-"}</span> },
            { key: "timestamp", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleDateString("zh-CN")}</span> },
          ]}
          data={metrics}
          onRowClick={(m) => setSelectedId(m.id)}
          onDelete={(id) => deleteMutation.mutate(id)}
          emptyMessage="暂无指标"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.name || "详情"}>
        {selected && (
          <div className="space-y-4 text-sm">
            <p><span className="text-muted-foreground">数值：</span><span className="font-semibold">{selected.value} {selected.unit}</span></p>
            {selected.category && <p><span className="text-muted-foreground">分类：</span>{selected.category}</p>}
            <p className="text-xs text-muted-foreground">记录于 {new Date(selected.timestamp).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
