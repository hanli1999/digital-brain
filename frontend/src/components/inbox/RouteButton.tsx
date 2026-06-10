import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/config/api";

const targets = [
  { key: "task", label: "入库到任务管理" },
  { key: "tool", label: "入库到工具资源库" },
  { key: "method", label: "入库到方法流程库" },
  { key: "library", label: "入库到文献库" },
  { key: "resources", label: "入库到资源管理" },
  { key: "ai-engine", label: "入库到 AI Agent 库" },
];

export function RouteButton({ inboxId }: { inboxId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (target: string) =>
      apiFetch(`/inbox/${inboxId}/route`, {
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
