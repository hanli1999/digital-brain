"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2Line, Delete2Line, SaveLine, CloseLine } from "@mingcute/react";
import { useState } from "react";

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  editFields?: { key: string; label: string; value: string; type?: "text" | "textarea" | "number" | "date" }[];
  onSave?: (data: Record<string, string>) => void;
}

export function DetailSheet({ open, onOpenChange, title, children, onDelete, editFields, onSave }: DetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleEdit = () => {
    if (!editFields) return;
    const init: Record<string, string> = {};
    editFields.forEach((f) => { init[f.key] = f.value; });
    setValues(init);
    setEditing(true);
  };

  const handleSave = () => {
    if (onSave) onSave(values);
    setEditing(false);
  };

  const handleCancel = () => setEditing(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <SheetHeader>
              <SheetTitle className="text-base leading-tight break-words">{title}</SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-1">
            {!editing && editFields && editFields.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleEdit} title="编辑">
                <Edit2Line className="h-4 w-4" />
              </Button>
            )}
            {onDelete && !editing && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} title="删除">
                <Delete2Line className="h-4 w-4" />
              </Button>
            )}
            {editing && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCancel} title="取消">
                <CloseLine className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/40" />

        {/* Content */}
        {editing && editFields ? (
          <div className="space-y-4 pt-1">
            {editFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
                {f.type === "textarea" ? (
                  <Textarea
                    className="min-h-[100px] resize-y"
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : f.type === "number" ? (
                  <Input
                    type="number"
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : f.type === "date" ? (
                  <Input
                    type="date"
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave}><SaveLine className="h-3.5 w-3.5 mr-1" />保存</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>取消</Button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            {children}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
