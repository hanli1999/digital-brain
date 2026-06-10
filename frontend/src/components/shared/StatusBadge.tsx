import { Badge } from "@/components/ui/badge";

const statusVariants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "待处理", variant: "default" },
  routed: { label: "已入库", variant: "secondary" },
  archived: { label: "已归档", variant: "outline" },
  todo: { label: "待办", variant: "default" },
  in_progress: { label: "进行中", variant: "default" },
  done: { label: "已完成", variant: "secondary" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusVariants[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
