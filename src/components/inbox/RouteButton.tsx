"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const targets = [
  { key: "task", label: "入库到任务板" },
  { key: "tool", label: "入库到工具箱" },
  { key: "method", label: "入库到方法库" },
  { key: "library", label: "入库到文献库" },
  { key: "calendar", label: "入库到日程" },
  { key: "ai-engine", label: "入库到 AI 引擎" },
];

export function RouteButton({ inboxId }: { inboxId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (target: string) =>
      fetch(`/api/inbox/${inboxId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeTarget: target }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "入库中..." : "入库 →"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {targets.map((t) => (
          <DropdownMenuItem key={t.key} onClick={() => mutation.mutate(t.key)}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
