import { prisma } from "./prisma.js";
import { Prisma } from "@prisma/client";

type ModelName = "tool" | "inboxItem" | "task" | "method" | "document" | "aiMechanism" | "resource" | "fileAsset" | "calendarEvent" | "jiyuanlu";

const TABLE_TO_MODEL: Record<string, ModelName> = {
  tools: "tool",
  inbox: "inboxItem",
  tasks: "task",
  methods: "method",
  library: "document",
  "ai-engine": "aiMechanism",
  resources: "resource",
  files: "fileAsset",
  calendar: "calendarEvent",
  jiyuanlu: "jiyuanlu",
};

function model(table: string) {
  const name = TABLE_TO_MODEL[table];
  if (!name) throw new Error(`Unknown table: ${table}`);
  return (prisma as any)[name];
}

export async function listRecords(table: string, params?: Record<string, string>): Promise<{ id: string; [key: string]: any }[]> {
  const m = model(table);
  const rows = await m.findMany({
    orderBy: { createdAt: "desc" },
    take: params?.page_size ? parseInt(params.page_size) : 500,
  });
  return rows.map((r: any) => ({ id: r.id, ...r }));
}

export async function getRecord(table: string, id: string): Promise<{ id: string; [key: string]: any } | null> {
  const m = model(table);
  const row = await m.findUnique({ where: { id } });
  if (!row) return null;
  return { id: row.id, ...row };
}

export async function createRecord(table: string, fields: Record<string, any>): Promise<{ id: string; [key: string]: any } | null> {
  const m = model(table);
  const row = await m.create({ data: fields });
  return { id: row.id, ...row };
}

export async function updateRecord(table: string, id: string, fields: Record<string, any>): Promise<{ id: string; [key: string]: any } | null> {
  const m = model(table);
  try {
    const row = await m.update({ where: { id }, data: fields });
    return { id: row.id, ...row };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return null; // not found or not owned by current user
    }
    throw e;
  }
}

export async function deleteRecord(table: string, id: string): Promise<boolean> {
  const m = model(table);
  try {
    await m.delete({ where: { id } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return false; // not found or not owned by current user
    }
    throw e;
  }
}
