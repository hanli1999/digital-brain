"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FilterPanelProps {
  tags: string[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

const MAX_VISIBLE = 8;

export function FilterPanel({ tags, activeTag, onTagChange }: FilterPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleTags = showAll ? tags : tags.slice(0, MAX_VISIBLE);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={activeTag === "" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTagChange("")}
      >
        全部
      </Button>
      {visibleTags.map((tag) => (
        <Button
          key={tag}
          variant={activeTag === tag ? "default" : "ghost"}
          size="sm"
          onClick={() => onTagChange(tag)}
        >
          {tag}
        </Button>
      ))}
      {tags.length > MAX_VISIBLE && !showAll && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
          +{tags.length - MAX_VISIBLE} 更多
        </Button>
      )}
      {showAll && tags.length > MAX_VISIBLE && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
          收起
        </Button>
      )}
    </div>
  );
}
