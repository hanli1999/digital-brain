"use client";

import { Button } from "@/components/ui/button";

interface FilterPanelProps {
  tags: string[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export function FilterPanel({ tags, activeTag, onTagChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={activeTag === "" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTagChange("")}
      >
        全部
      </Button>
      {tags.map((tag) => (
        <Button
          key={tag}
          variant={activeTag === tag ? "default" : "ghost"}
          size="sm"
          onClick={() => onTagChange(tag)}
        >
          {tag}
        </Button>
      ))}
    </div>
  );
}
