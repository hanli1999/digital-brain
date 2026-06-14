import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddLine, CloseLine, CheckLine } from "@mingcute/react";
import { apiFetch } from "@/config/api";

interface ModuleConfig {
  key: string;
  label: string;
  titleField: string; // "title" | "name" | "detail"
}

const MODULE_CONFIGS: ModuleConfig[] = [
  { key: "tools", label: "法器阁", titleField: "name" },
  { key: "methods", label: "功法库", titleField: "title" },
  { key: "library", label: "丹房", titleField: "title" },
  { key: "ai-engine", label: "AI机制库", titleField: "name" },
  { key: "resources", label: "资源库", titleField: "name" },
  { key: "insight", label: "洞察", titleField: "title" },
  { key: "jiyuanlu", label: "机缘录", titleField: "detail" },
  { key: "tasks", label: "任务", titleField: "title" },
];

interface RecordInfo {
  id: string;
  title: string;
  module: string;
}

interface RecordPickerProps {
  value: string; // JSON array of IDs
  onChange: (value: string) => void;
  modules: string[]; // module keys to search across
  label?: string;
}

export function RecordPicker({ value, onChange, modules, label }: RecordPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIds: string[] = (() => {
    try { return JSON.parse(value || "[]"); } catch { return []; }
  })();

  const [resolved, setResolved] = useState<RecordInfo[]>([]);

  // Resolve selected IDs to display names
  useEffect(() => {
    if (selectedIds.length === 0) { setResolved([]); return; }
    const unresolved = selectedIds.filter(id => !resolved.find(r => r.id === id));
    if (unresolved.length === 0) return;

    Promise.all(
      modules.map(mod =>
        apiFetch(`/records/batch?ids=${unresolved.join(",")}&module=${mod}`)
          .then(r => r.json()).catch(() => [])
      )
    ).then(results => {
      const all: RecordInfo[] = results.flat();
      setResolved(prev => {
        const existing = new Set(prev.map(r => r.id));
        return [...prev, ...all.filter((r: any) => !existing.has(r.id))];
      });
    });
  }, [value]);

  const addId = (id: string, title: string, module: string) => {
    if (selectedIds.includes(id)) return;
    const newIds = [...selectedIds, id];
    onChange(JSON.stringify(newIds));
    setResolved(prev => [...prev, { id, title, module }]);
  };

  const removeId = (id: string) => {
    const newIds = selectedIds.filter(i => i !== id);
    onChange(JSON.stringify(newIds));
    setResolved(prev => prev.filter(r => r.id !== id));
  };

  const getConfig = (mod: string) => MODULE_CONFIGS.find(c => c.key === mod);

  return (
    <div>
      {label && <p className="text-[11px] text-muted-foreground/60 mb-1.5 uppercase tracking-wider font-medium">{label}</p>}
      <div className="flex flex-wrap gap-1 mb-2">
        {resolved.map(r => {
          const cfg = getConfig(r.module);
          return (
            <Badge key={r.id} variant="secondary" className="text-xs gap-1 pr-1">
              <span className="text-[10px] text-muted-foreground/60 mr-0.5">{cfg?.label || r.module}</span>
              {r.title}
              <button onClick={() => removeId(r.id)} className="ml-0.5 hover:text-destructive">
                <CloseLine className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" type="button">
            <AddLine className="h-3 w-3" />
            链接记录
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <PickerCommand modules={modules} open={open} selectedIds={selectedIds} onSelect={addId} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PickerCommand({ modules, open, selectedIds, onSelect }: {
  modules: string[];
  open: boolean;
  selectedIds: string[];
  onSelect: (id: string, title: string, module: string) => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <Command>
      <CommandInput placeholder="搜索记录..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>未找到</CommandEmpty>
        {modules.map(mod => (
          <PickerGroup key={mod} module={mod} search={search} open={open} selectedIds={selectedIds} onSelect={onSelect} />
        ))}
      </CommandList>
    </Command>
  );
}

function PickerGroup({ module, search, open, selectedIds, onSelect }: {
  module: string;
  search: string;
  open: boolean;
  selectedIds: string[];
  onSelect: (id: string, title: string, module: string) => void;
}) {
  const cfg = MODULE_CONFIGS.find(c => c.key === module);
  const label = cfg?.label || module;
  const titleField = cfg?.titleField || "title";

  const { data = [] } = useQuery({
    queryKey: ["picker", module],
    queryFn: async () => {
      const res = await apiFetch(`/${module}`).then(r => r.json());
      return Array.isArray(res) ? res : [];
    },
    enabled: open,
    staleTime: 30000,
  });

  const filtered = search.length >= 1
    ? (data as any[]).filter((r: any) => {
        const t = (r[titleField] || "").toLowerCase();
        return t.includes(search.toLowerCase());
      }).slice(0, 15)
    : (data as any[]).slice(0, 15);

  if (filtered.length === 0) return null;

  return (
    <CommandGroup heading={label}>
      {filtered.map((r: any) => {
        const title = r[titleField] || "(无标题)";
        const isSelected = selectedIds.includes(r.id);
        return (
          <CommandItem key={r.id} onSelect={() => onSelect(r.id, title, module)} disabled={isSelected}>
            <CheckLine className={`h-3.5 w-3.5 mr-2 shrink-0 ${isSelected ? "opacity-100 text-primary" : "opacity-0"}`} />
            <span className="truncate text-xs">{title}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
