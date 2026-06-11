"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns, data, onRowClick, onDelete, emptyMessage = "暂无数据",
}: DataTableProps<T>) {
  const [deleting, setDeleting] = useState<string | null>(null);

  if (data.length === 0) {
    return <div className="text-center py-12 text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  const allColumns = onDelete ? [
    ...columns,
    {
      key: "_actions",
      header: "",
      className: "w-10",
      cell: (item: T) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          disabled={deleting === item.id}
          onClick={(e) => { e.stopPropagation(); setDeleting(item.id); onDelete(item.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ] : columns;

  return (
    <div className="w-full overflow-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          {allColumns.map((col) => (
            <TableHead key={col.key} className={col.className || ""}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onRowClick?.(item)}>
            {allColumns.map((col) => (
              <TableCell key={col.key} className={col.className || ""}>{col.cell(item)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
