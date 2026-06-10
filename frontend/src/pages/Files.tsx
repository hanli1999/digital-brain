import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import type { FileAsset } from "@/types/api";

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
    queryFn: () => apiFetch(`/files`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { filename: string; data: string; mimeType: string }) =>
      apiFetch(`/files/upload`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setShowNew(false);
      toast.success("已上传文件");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/files/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["files"] }); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const handleUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      createMutation.mutate({ filename: f.name, data: base64, mimeType: f.type });
      setUploading(false);
    };
    reader.readAsDataURL(f);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{files.length} 个文件</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 上传文件</DialogTrigger>
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
