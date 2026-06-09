"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: string;
  tags: string;
}

const columns = [
  { key: "todo", label: "待办", color: "bg-neutral-100 dark:bg-neutral-900" },
  { key: "in_progress", label: "进行中", color: "bg-blue-50 dark:bg-blue-950" },
  { key: "done", label: "已完成", color: "bg-green-50 dark:bg-green-950" },
] as const;

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowNew(false);
      setTitle("");
      setDesc("");
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="任务板为空"
        description="从收件箱入库或手动创建任务"
        actionLabel="新建任务"
        onAction={() => setShowNew(true)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{tasks.length} 个任务</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 新建任务</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
            <Input placeholder="任务标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Button onClick={() => createMutation.mutate({ title, description: desc })} disabled={createMutation.isPending}>创建</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className={`rounded-lg p-4 ${col.color}`}>
            <h3 className="text-sm font-semibold mb-3">
              {col.label} ({tasks.filter((t) => t.status === col.key).length})
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === col.key)
                .map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-sm">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={task.priority === "urgent" ? "pending" : "todo"} />
                        {col.key !== "done" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs ml-auto"
                            onClick={() =>
                              moveMutation.mutate({
                                id: task.id,
                                status: col.key === "todo" ? "in_progress" : "done",
                              })
                            }
                          >
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
    </div>
  );
}
