"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: string;
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const { data: metrics = [], isLoading } = useQuery<Metric[]>({
    queryKey: ["metrics"],
    queryFn: () => fetch("/api/metrics").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; value: number; unit: string; category: string }) =>
      fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      setShowNew(false);
      setName("");
      setValue("");
      setUnit("");
      setCategory("");
    },
  });

  const categories = Array.from(new Set(metrics.map((m) => m.category).filter(Boolean)));
  const totalByCat = categories.map((cat) => ({
    category: cat,
    count: metrics.filter((m) => m.category === cat).length,
  }));

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{metrics.length} 条记录</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 添加指标</Button>
          </DialogTrigger>
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
          emptyMessage="暂无指标"
        />
      )}
    </div>
  );
}
