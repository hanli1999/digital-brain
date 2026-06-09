"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AiMech {
  id: string;
  name: string;
  type: string;
  content: string;
  parameters: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  prompt: "提示词",
  workflow: "工作流",
  agent: "智能体",
  skill: "技能",
};

export default function AiEnginePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("prompt");
  const [content, setContent] = useState("");
  const [parameters, setParameters] = useState("");

  const { data: items = [], isLoading } = useQuery<AiMech[]>({
    queryKey: ["ai-engine"],
    queryFn: () => fetch("/api/ai-engine").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; content: string; parameters: string }) =>
      fetch("/api/ai-engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-engine"] });
      setShowNew(false);
      setName("");
      setType("prompt");
      setContent("");
      setParameters("");
    },
  });

  const selected = items.find((i) => i.id === selectedId);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{items.length} 个 AI 机制</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 新建机制</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>新建 AI 机制</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
              <select className="w-full border rounded p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="prompt">提示词</option>
                <option value="workflow">工作流</option>
                <option value="agent">智能体</option>
                <option value="skill">技能</option>
              </select>
              <Textarea placeholder="内容 / 提示词" className="min-h-[200px] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
              <Input placeholder="参数 (JSON)" value={parameters} onChange={(e) => setParameters(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ name, type, content, parameters })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState title="AI 引擎为空" description="从收件箱入库或手动添加 AI 提示词、工作流" actionLabel="新建机制" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "名称", cell: (m) => <span className="font-medium">{m.name}</span> },
            { key: "type", header: "类型", cell: (m) => <Badge variant="secondary" className="text-xs">{typeLabels[m.type] || m.type}</Badge> },
            { key: "createdAt", header: "时间", cell: (m) => <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</span> },
          ]}
          data={items}
          onRowClick={(m) => setSelectedId(m.id)}
          emptyMessage="暂无机制"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.name || "详情"}>
        {selected && (
          <div className="space-y-4 text-sm">
            <Badge variant="secondary">{typeLabels[selected.type] || selected.type}</Badge>
            <div className="whitespace-pre-wrap font-mono text-xs text-muted-foreground bg-muted p-3 rounded">
              {selected.content}
            </div>
            {selected.parameters && selected.parameters !== "{}" && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">参数：</p>
                <pre className="text-xs bg-muted p-2 rounded">{selected.parameters}</pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground">创建于 {new Date(selected.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
