import { Badge } from "@/components/ui/badge";
import { safeDate } from "@/lib/utils";
import { ExternalLinkLine } from "@mingcute/react";

interface FieldRowProps {
  label: string;
  value?: string | null;
  /** Render as clickable link */
  link?: boolean;
  /** Render as colored badge */
  badge?: boolean;
  /** Render as multi-line block text */
  block?: boolean;
  /** Render as formatted date */
  date?: boolean;
  /** Render tags as badge cluster (value should be JSON string array) */
  tags?: boolean;
  /** Custom badge color class */
  badgeClass?: string;
}

export function FieldRow({ label, value, link, badge, block, date, tags, badgeClass }: FieldRowProps) {
  if (!value && value !== "0") return null;

  if (tags) {
    try {
      const parsed: string[] = JSON.parse(value);
      if (parsed.length === 0) return null;
      return (
        <div>
          <p className="text-[11px] text-muted-foreground/60 mb-1 uppercase tracking-wider font-medium">{label}</p>
          <div className="flex flex-wrap gap-1">
            {parsed.map((t) => (
              <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted/60 text-muted-foreground border border-border/30">{t}</span>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  }

  return (
    <div>
      <p className="text-[11px] text-muted-foreground/60 mb-1 uppercase tracking-wider font-medium">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline break-all text-xs group">
          <span className="truncate max-w-[320px]">{value}</span>
          <ExternalLinkLine className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </a>
      ) : badge ? (
        <Badge variant="secondary" className={`text-xs ${badgeClass || ""}`}>{value}</Badge>
      ) : date ? (
        <p className="text-sm font-mono text-muted-foreground">{safeDate(value, "datetime")}</p>
      ) : block ? (
        <div className="rounded-lg bg-muted/30 border border-border/20 p-3">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
        </div>
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}
