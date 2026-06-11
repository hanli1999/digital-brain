import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/config/api";

const targets = [
  { key: "tool", label: "🔧 入库到工具资源库", keywords: ["工具", "软件", "网站", "tool", "平台", "APP"] },
  { key: "task", label: "📋 入库到任务管理", keywords: ["任务", "做", "完成", "todo", "待办", "处理"] },
  { key: "method", label: "📐 入库到方法流程库", keywords: ["方法", "流程", "步骤", "workflow", "方案", "策略"] },
  { key: "library", label: "📚 入库到文献库", keywords: ["论文", "文章", "文献", "paper", "阅读", "研究"] },
  { key: "ai-engine", label: "🤖 入库到 AI Agent 库", keywords: ["AI", "agent", "智能体", "prompt", "提示词", "模型", "GPT", "LLM"] },
  { key: "resources", label: "📊 入库到资源管理", keywords: ["数据", "指标", "统计", "metric", "资源", "预算"] },
  { key: "calendar", label: "📅 入库到日程", keywords: ["时间", "日期", "预约", "会议", "日程", "安排"] },
  { key: "files", label: "📁 入库到文件管理", keywords: ["文件", "文档", "图片", "附件", "下载"] },
  { key: "insight", label: "💡 入库到洞察", keywords: ["灵感", "想法", "洞察", "感悟", "观察", "反思", "insight", "笔记", "随记", "领悟"] },
];

// AI parse-card 中文名 → 前端 target key
const AI_TO_KEY: Record<string, string> = {
  "收件箱": "inbox", "任务管理": "task",
  "法器阁": "tool", "工具资源库": "tool",
  "功法库": "method", "方法流程库": "method", "方法库": "method",
  "文献库": "library", "丹房": "library",
  "资源管理": "resources",
  "AI引擎库": "ai-engine", "AI Agent库": "ai-engine",
  "机缘录": "insight", "洞察": "insight",
  "文件管理": "files",
  "日程": "calendar", "任务清单": "calendar",
};

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

export function RouteButton({ inboxId, title = "", content = "", aiTarget }: { inboxId: string; title?: string; content?: string; aiTarget?: string | null }) {
  const queryClient = useQueryClient();
  // AI 分类优先于关键词匹配
  const aiKey = aiTarget ? AI_TO_KEY[aiTarget] : null;
  const keywordGuess = suggestTarget(title, content);
  const suggested = aiKey || keywordGuess;

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
    onSuccess: (data: { target: string; targetLabel: string }) => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: [data.target] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`已入库到${data.targetLabel || data.target}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "入库失败");
    },
  });

  const suggestedLabel = targets.find((t) => t.key === suggested)?.label || "";
  const suggestedName = suggestedLabel.split(" ").slice(1).join(" ") || suggestedLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "入库中..." : suggested ? (aiKey ? `🤖 ${suggestedName} →` : `入库到 ${suggestedName} →`) : "入库 →"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {suggested && (
          <>
            <DropdownMenuItem onClick={() => mutation.mutate(suggested)} className="font-medium text-primary">
              {targets.find((t) => t.key === suggested)?.label} <span className="ml-1 text-xs text-muted-foreground">（{aiKey ? "AI推荐" : "推荐"}）</span>
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
