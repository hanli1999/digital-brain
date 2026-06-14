import { prisma } from "./prisma.js";

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
  const row = await m.update({ where: { id }, data: fields });
  return { id: row.id, ...row };
}

export async function deleteRecord(table: string, id: string): Promise<boolean> {
  const m = model(table);
  await m.delete({ where: { id } });
  return true;
}
