"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startTime, setStartTime] = useState("");

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar"],
    queryFn: () => fetch("/api/calendar").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; startTime: string }) =>
      fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setShowNew(false);
      setTitle("");
      setDesc("");
      setStartTime("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/calendar/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  });

  const dateStr = (d: Date) => d.toISOString().split("T")[0];
  const selectedStr = dateStr(selectedDate);
  const dayEvents = events.filter((e) => e.startTime.startsWith(selectedStr));

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-muted-foreground">{events.length} 个日程</h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger>
            <Button size="sm">+ 新建日程</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建日程</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="描述" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Button onClick={() => createMutation.mutate({ title, description: desc, startTime })} disabled={createMutation.isPending}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            className="rounded-md border"
          />
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
                <div key={e.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{e.title}</h4>
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(e.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        {e.endTime && ` - ${new Date(e.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => deleteMutation.mutate(e.id)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
