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
import type { AiMechanism } from "@/types/api";

export default function AiEnginePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [component, setComponent] = useState("");
  const [coreIdea, setCoreIdea] = useState("");
  const [features, setFeatures] = useState("");
  const [featuresDetail, setFeaturesDetail] = useState("");
  const [examples, setExamples] = useState("");
  const [scenarios, setScenarios] = useState("");
  const [scenariosDetail, setScenariosDetail] = useState("");
  const [source, setSource] = useState("");

  const { data: items = [], isLoading } = useQuery<AiMechanism[]>({
    queryKey: ["ai-engine"],
    queryFn: () => apiFetch(`/ai-engine`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/ai-engine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-engine"] });
      setShowNew(false); setName(""); setComponent(""); setCoreIdea(""); setFeatures("");
      setFeaturesDetail(""); setExamples(""); setScenarios(""); setScenariosDetail(""); setSource("");
      toast.success("已添加机制");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/ai-engine/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-engine"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/ai-engine/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-engine"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const selected = items.find((i) => i.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{items.length} 个 AI 机制</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建机制</DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>新建 AI 机制</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="名称 *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="组件 / 框架" value={component} onChange={(e) => setComponent(e.target.value)} />
              <Textarea placeholder="核心思路" className="min-h-[80px]" value={coreIdea} onChange={(e) => setCoreIdea(e.target.value)} />
              <Textarea placeholder="功能特性" className="min-h-[80px]" value={features} onChange={(e) => setFeatures(e.target.value)} />
              <Textarea placeholder="功能详解" className="min-h-[100px]" value={featuresDetail} onChange={(e) => setFeaturesDetail(e.target.value)} />
              <Textarea placeholder="示例" className="min-h-[80px]" value={examples} onChange={(e) => setExamples(e.target.value)} />
              <Textarea placeholder="适用场景" className="min-h-[80px]" value={scenarios} onChange={(e) => setScenarios(e.target.value)} />
              <Textarea placeholder="场景详解" className="min-h-[100px]" value={scenariosDetail} onChange={(e) => setScenariosDetail(e.target.value)} />
              <Input placeholder="来源" value={source} onChange={(e) => setSource(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, component, coreIdea, features, featuresDetail, examples, scenarios, scenariosDetail, source })} disabled={createMutation.isPending || !name}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState title="AI 引擎为空" description="从收件箱入库或手动添加 AI 提示词、工作流" actionLabel="新建机制" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "名称", cell: (m) => <span className="font-medium whitespace-nowrap">{toStr(m.name)}</span>, className: "min-w-[120px]" },
            { key: "component", header: "组件", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[120px]">{toStr(m.component) || "-"}</span>, className: "max-w-[120px]" },
            { key: "coreIdea", header: "核心思路", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">{toStr(m.coreIdea) || "-"}</span>, className: "max-w-[180px]" },
            { key: "features", header: "功能特性", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">{toStr(m.features) || "-"}</span>, className: "max-w-[180px]" },
            { key: "scenarios", header: "适用场景", cell: (m) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{toStr(m.scenarios) || "-"}</span>, className: "max-w-[150px]" },
            { key: "source", header: "来源", cell: (m) => <span className="text-xs text-muted-foreground max-w-[120px] truncate">{toStr(m.source) || "-"}</span>, className: "max-w-[120px]" },
            { key: "createdAt", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{safeDate(m.createdAt)}</span>, className: "whitespace-nowrap" },
          ]}
          data={items} onRowClick={(m) => setSelectedId(m.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无机制"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={toStr(selected?.name) || "详情"}
        editFields={selected ? [
          { key: "name", label: "名称", value: toStr(selected.name) },
          { key: "component", label: "组件", value: toStr(selected.component) },
          { key: "coreIdea", label: "核心思路", value: toStr(selected.coreIdea), type: "textarea" },
          { key: "features", label: "功能特性", value: toStr(selected.features), type: "textarea" },
          { key: "featuresDetail", label: "功能详解", value: toStr(selected.featuresDetail), type: "textarea" },
          { key: "examples", label: "示例", value: toStr(selected.examples), type: "textarea" },
          { key: "scenarios", label: "适用场景", value: toStr(selected.scenarios), type: "textarea" },
          { key: "scenariosDetail", label: "场景详解", value: toStr(selected.scenariosDetail), type: "textarea" },
          { key: "source", label: "来源", value: toStr(selected.source) },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">名称</p><p className="text-sm font-medium">{toStr(selected.name)}</p></div>
            {toStr(selected.component) && <div><p className="text-xs text-muted-foreground mb-0.5">组件</p><Badge variant="secondary" className="text-xs">{toStr(selected.component)}</Badge></div>}
            {toStr(selected.coreIdea) && <div><p className="text-xs text-muted-foreground mb-0.5">核心思路</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{toStr(selected.coreIdea)}</p></div>}
            {toStr(selected.features) && <div><p className="text-xs text-muted-foreground mb-0.5">功能特性</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{toStr(selected.features)}</p></div>}
            {toStr(selected.featuresDetail) && <div><p className="text-xs text-muted-foreground mb-0.5">功能详解</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{toStr(selected.featuresDetail)}</p></div>}
            {toStr(selected.examples) && <div><p className="text-xs text-muted-foreground mb-0.5">示例</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{toStr(selected.examples)}</p></div>}
            {toStr(selected.scenarios) && <div><p className="text-xs text-muted-foreground mb-0.5">适用场景</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{toStr(selected.scenarios)}</p></div>}
            {toStr(selected.scenariosDetail) && <div><p className="text-xs text-muted-foreground mb-0.5">场景详解</p><p className="text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{toStr(selected.scenariosDetail)}</p></div>}
            {toStr(selected.source) && <div><p className="text-xs text-muted-foreground mb-0.5">来源</p><p className="text-xs">{toStr(selected.source)}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">创建时间</p><p className="text-xs">{safeDate(selected.createdAt, "datetime")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
