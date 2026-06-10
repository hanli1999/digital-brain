import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/config/api";

const targets = [
  { key: "task", label: "📋 入库到任务管理", keywords: ["任务", "做", "完成", "todo", "待办", "处理"] },
  { key: "tool", label: "🔧 入库到工具资源库", keywords: ["工具", "软件", "网站", "tool", "平台", "APP"] },
  { key: "method", label: "📐 入库到方法流程库", keywords: ["方法", "流程", "步骤", "workflow", "方案", "策略"] },
  { key: "library", label: "📚 入库到文献库", keywords: ["论文", "文章", "文献", "paper", "阅读", "研究"] },
  { key: "ai-engine", label: "🤖 入库到 AI Agent 库", keywords: ["AI", "agent", "智能体", "prompt", "提示词", "模型", "GPT", "LLM"] },
  { key: "resources", label: "📊 入库到资源管理", keywords: ["数据", "指标", "统计", "metric", "资源", "预算"] },
];

function suggestTarget(title: string, content: string): string | null {
  const text = `${title} ${content}`.toLowerCase();
  let bestScore = 0;
  let bestTarget: string | null = null;
  for (const t of targets) {
    let score = 0;
    for (const kw of t.keywords) {
      if (text.includes(kw)) score += kw.length;
    }
    if (score > bestScore) { bestScore = score; bestTarget = t.key; }
  }
  return bestScore >= 2 ? bestTarget : null;
}

export function RouteButton({ inboxId, title = "", content = "" }: { inboxId: string; title?: string; content?: string }) {
  const queryClient = useQueryClient();
  const suggested = suggestTarget(title, content);

  const mutation = useMutation({
    mutationFn: (target: string) =>
      apiFetch(`/inbox/${inboxId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeTarget: target }),
      }).then((r) => {
        if (!r.ok) throw new Error("入库失败");
        return r.json();
      }),
    onSuccess: (data: { target: string }) => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: [data.target] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const targetLabel = targets.find((t) => t.key === data.target)?.label || data.target;
      toast.success(`已入库到${targetLabel.replace(/^[^\s]+\s/, "")}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "入库失败");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "入库中..." : suggested ? `入库到 ${targets.find((t) => t.key === suggested)?.label.split(" ")[1] || ""} →` : "入库 →"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {suggested && (
          <>
            <DropdownMenuItem onClick={() => mutation.mutate(suggested)} className="font-medium text-primary">
              {targets.find((t) => t.key === suggested)?.label} <span className="ml-1 text-xs text-muted-foreground">（推荐）</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {targets.filter((t) => t.key !== suggested).map((t) => (
          <DropdownMenuItem key={t.key} onClick={() => mutation.mutate(t.key)}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
