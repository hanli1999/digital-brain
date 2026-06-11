import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 飞书API字段值可能是 {text,link} 对象，归一化为 string */
export function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.link === "string") return o.link;
    if (typeof o.name === "string") return o.name;
    return String(v);
  }
  return "";
}
