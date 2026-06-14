import { Button } from "@/components/ui/button";
import { KawaiiDecor, type ModuleId } from "@/components/shared/KawaiiDecor";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  module?: ModuleId;
}

export function EmptyState({ title, description, actionLabel, onAction, module = "empty" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <KawaiiDecor module={module} size={160} mood="sad" className="mb-2 opacity-80" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
