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
import { Calendar } from "@/components/ui/calendar";
import { apiFetch } from "@/config/api";
import type { CalendarEvent } from "@/types/api";

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar"],
    queryFn: () => apiFetch(`/calendar`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/calendar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setShowNew(false); setTitle(""); setDesc(""); setContent(""); setStartTime("");
      setEndTime(""); setPriority(""); setProjectId("");
      toast.success("已添加日程");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, string>) =>
      apiFetch(`/calendar/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar"] }); setSelectedId(null); toast.success("已更新"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/calendar/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar"] }); setSelectedId(null); toast.success("已删除"); },
    onError: () => toast.error("删除失败"),
  });

  const dateStr = (d: Date) => d.toISOString().split("T")[0];
  const selectedStr = dateStr(selectedDate);
  const dayEvents = events.filter((e) => e.startTime?.startsWith(selectedStr));
  const selected = events.find((e) => e.id === selectedId);
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{events.length} 个日程</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-3 text-xs font-medium transition-all">+ 新建日程</DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>新建日程</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="内容" value={content} onChange={(e) => setContent(e.target.value)} />
              <Textarea placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <Input placeholder="优先级" value={priority} onChange={(e) => setPriority(e.target.value)} />
              <Input placeholder="项目 ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, content, description: desc, startTime, endTime, priority, projectId })} disabled={createMutation.isPending || !title}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} className="rounded-md border" />
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">全部日程</h3>
            <DataTable
              columns={[
                { key: "title", header: "标题", cell: (e) => <span className="font-medium text-xs whitespace-nowrap">{e.title}</span>, className: "min-w-[100px]" },
                { key: "status", header: "状态", cell: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{e.status || "-"}</span>, className: "whitespace-nowrap" },
                { key: "priority", header: "优先级", cell: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{e.priority || "-"}</span>, className: "whitespace-nowrap" },
                { key: "startTime", header: "开始", cell: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{e.startTime ? new Date(e.startTime).toLocaleString("zh-CN") : "-"}</span>, className: "whitespace-nowrap" },
                { key: "endTime", header: "结束", cell: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{e.endTime ? new Date(e.endTime).toLocaleString("zh-CN") : "-"}</span>, className: "whitespace-nowrap" },
              ]}
              data={events} onRowClick={(e) => setSelectedId(e.id)} onDelete={(id) => deleteMutation.mutate(id)} emptyMessage="暂无日程"
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">
            {selectedDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            {dayEvents.length > 0 && <span className="text-muted-foreground ml-1">({dayEvents.length})</span>}
          </h3>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">当天无日程</p>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((e) => (
                <div key={e.id} className="p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(e.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{e.title}</h4>
                      {e.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.content}</p>}
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          {e.endTime && ` - ${new Date(e.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
                        </p>
                        {e.allDay === "true" && <Badge variant="secondary" className="text-[10px]">全天</Badge>}
                        {e.priority && <Badge variant="secondary" className="text-[10px]">{e.priority}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={(ev) => { ev.stopPropagation(); deleteMutation.mutate(e.id); }}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DetailSheet open={!!selected} onOpenChange={() => setSelectedId(null)} title={selected?.title || "详情"}
        editFields={selected ? [
          { key: "title", label: "标题", value: selected.title || "" },
          { key: "content", label: "内容", value: selected.content || "", type: "textarea" },
          { key: "description", label: "描述", value: selected.description || "", type: "textarea" },
          { key: "startTime", label: "开始时间", value: selected.startTime || "" },
          { key: "endTime", label: "结束时间", value: selected.endTime || "" },
          { key: "priority", label: "优先级", value: selected.priority || "" },
          { key: "status", label: "状态", value: selected.status || "" },
          { key: "projectId", label: "项目 ID", value: selected.projectId || "" },
        ] : undefined}
        onSave={(data) => { if (selected) updateMutation.mutate({ id: selected.id, ...data }); }}
        onDelete={() => { if (selected) deleteMutation.mutate(selected.id); }}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground mb-0.5">标题</p><p className="text-sm font-medium">{selected.title}</p></div>
            {selected.content && <div><p className="text-xs text-muted-foreground mb-0.5">内容</p><p className="text-xs whitespace-pre-wrap leading-relaxed">{selected.content}</p></div>}
            {selected.description && <div><p className="text-xs text-muted-foreground mb-0.5">描述</p><p className="text-xs">{selected.description}</p></div>}
            <div className="grid grid-cols-2 gap-2">
              {selected.startTime && <div><p className="text-xs text-muted-foreground mb-0.5">开始</p><p className="text-xs">{new Date(selected.startTime).toLocaleString("zh-CN")}</p></div>}
              {selected.endTime && <div><p className="text-xs text-muted-foreground mb-0.5">结束</p><p className="text-xs">{new Date(selected.endTime).toLocaleString("zh-CN")}</p></div>}
            </div>
            {selected.allDay === "true" && <div><Badge variant="secondary" className="text-xs">全天</Badge></div>}
            {selected.priority && <div><p className="text-xs text-muted-foreground mb-0.5">优先级</p><p className="text-xs">{selected.priority}</p></div>}
            {selected.status && <div><p className="text-xs text-muted-foreground mb-0.5">状态</p><p className="text-xs">{selected.status}</p></div>}
            {selected.projectId && <div><p className="text-xs text-muted-foreground mb-0.5">项目</p><p className="text-xs">{selected.projectId}</p></div>}
            <div><p className="text-xs text-muted-foreground mb-0.5">创建时间</p><p className="text-xs">{new Date(selected.createdAt).toLocaleString("zh-CN")}</p></div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
