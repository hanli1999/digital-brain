"use client";

export function SyncIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-green-400" />
      <span>已同步</span>
    </div>
  );
}
