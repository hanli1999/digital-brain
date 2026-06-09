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

interface Document {
  id: string;
  title: string;
  abstract: string;
  author: string;
  tags: string;
  createdAt: string;
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [author, setAuthor] = useState("");

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ["library"],
    queryFn: () => fetch("/api/library").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; abstract: string; author: string }) =>
      fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      setShowNew(false);
      setTitle("");
      setAbstract("");
      setAuthor("");
    },
  });

  const selected = docs.find((d) => d.id === selectedId);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{docs.length} 篇文献</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 添加文献</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加文献</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="作者" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <Textarea placeholder="摘要" className="min-h-[150px]" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, abstract, author })} disabled={createMutation.isPending}>添加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {docs.length === 0 ? (
        <EmptyState title="文献库为空" description="从收件箱入库或手动添加文献" actionLabel="添加文献" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "标题", cell: (d) => <span className="font-medium">{d.title}</span> },
            { key: "author", header: "作者", cell: (d) => <span className="text-xs text-muted-foreground">{d.author || "-"}</span> },
            { key: "createdAt", header: "时间", cell: (d) => <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString("zh-CN")}</span> },
          ]}
          data={docs}
          onRowClick={(d) => setSelectedId(d.id)}
          emptyMessage="暂无文献"
        />
      )}

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.title || "详情"}>
        {selected && (
          <div className="space-y-4 text-sm">
            {selected.author && <p className="text-muted-foreground">作者：{selected.author}</p>}
            <p className="whitespace-pre-wrap text-muted-foreground">{selected.abstract}</p>
            <p className="text-xs text-muted-foreground">添加于 {new Date(selected.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
