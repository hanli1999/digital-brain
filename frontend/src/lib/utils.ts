import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 飞书API字段值可能是 {text,link} 对象，归一化为 string。link优先（URL字段），text次之 */
export function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.link === "string" && o.link) return o.link;
    if (typeof o.text === "string") return o.text;
    if (typeof o.name === "string") return o.name;
    return String(v);
  }
  return "";
}

/** 安全日期格式化。处理 Feishu 时间戳（毫秒数字）、日期字符串、undefined/null */
export function safeDate(v: unknown, fmt: "date" | "datetime" = "date"): string {
  if (v == null) return "-";
  let d: Date;
  if (typeof v === "number") {
    d = new Date(v);
  } else if (typeof v === "string") {
    d = new Date(v);
  } else {
    return "-";
  }
  if (isNaN(d.getTime())) return "-";
  return fmt === "datetime"
    ? d.toLocaleString("zh-CN")
    : d.toLocaleDateString("zh-CN");
}

/** 简易 markdown 去符号，只保留纯文本 */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.+?\)/g, "")
    .replace(/^[*\-+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/^>\s/gm, "")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
