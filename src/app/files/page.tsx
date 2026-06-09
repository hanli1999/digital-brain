"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
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

interface FileAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  tags: string;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useQuery<FileAsset[]>({
    queryKey: ["files"],
    queryFn: () => fetch("/api/files").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { filename: string; url: string; mimeType: string; size: number }) =>
      fetch("/api/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setShowNew(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/files/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files"] }),
  });

  const handleUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    createMutation.mutate({
      filename: f.name,
      url: URL.createObjectURL(f),
      mimeType: f.type,
      size: f.size,
    });
    setUploading(false);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{files.length} 个文件</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 上传文件</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>上传文件</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input type="file" ref={fileRef} />
              <Button onClick={handleUpload} disabled={uploading || createMutation.isPending}>
                {uploading ? "上传中..." : "上传"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <EmptyState title="文件库为空" description="上传文件或从其他模块关联" actionLabel="上传文件" onAction={() => setShowNew(true)} />
      ) : (
        <DataTable
          columns={[
            { key: "filename", header: "文件名", cell: (f) => <span className="font-medium text-sm">{f.filename}</span> },
            { key: "mimeType", header: "类型", cell: (f) => <span className="text-xs text-muted-foreground">{f.mimeType}</span> },
            { key: "size", header: "大小", cell: (f) => <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span> },
            { key: "createdAt", header: "上传时间", cell: (f) => <span className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString("zh-CN")}</span> },
            {
              key: "actions",
              header: "操作",
              cell: (f) => (
                <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(f.id); }}>删除</Button>
              ),
            },
          ]}
          data={files}
          emptyMessage="暂无文件"
        />
      )}
    </div>
  );
}
