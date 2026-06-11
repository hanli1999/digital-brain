"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Delete2Line, SaveLine } from "@mingcute/react";
import { useState } from "react";

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  editFields?: { key: string; label: string; value: string; type?: "text" | "textarea" }[];
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {editing && editFields ? (
          <div className="mt-4 space-y-3">
            {editFields.map((f) =>
              f.type === "textarea" ? (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <Textarea value={values[f.key] || ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <Input value={values[f.key] || ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                </div>
              )
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><SaveLine className="h-3.5 w-3.5 mr-1" />保存</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>取消</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {children}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              {editFields && editFields.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleEdit}>编辑</Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                  <Delete2Line className="h-3.5 w-3.5 mr-1" />删除
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
