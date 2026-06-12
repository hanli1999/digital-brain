import { feishuRequest } from "./feishu.js";
import { prisma } from "./prisma.js";
import type { InboxItem, Task, Tool, Method, Document, FileAsset, CalendarEvent, AiMechanism, Metric } from "@prisma/client";

const APP_TOKEN = "MDmcwLhJIiwpK5k5yuecRWu4nee";

// ── Table config ──────────────────────────────────────────────
interface TableConfig {
  tableId: string;
  tableName: string;
  /** local field → Feishu field name (Chinese) */
  fieldMap: Record<string, string>;
  /** fields to skip (internal use only) */
  skipFields: string[];
}

const tables: Record<string, TableConfig> = {
  inbox: {
    tableId: "tbl2pG26LdF3c3cX",
    tableName: "今日收件箱",
    fieldMap: {
      title: "收集内容",
      content: "收集内容",
      source: "来源",
      tags: "初步分类",
      status: "处理状态",
      routeTarget: "归入建议",
      routedTo: "归位去处",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "imageUrls"],
  },
  task: {
    tableId: "tblOyyByZYtZz7dA",
    tableName: "任务管理",
    fieldMap: {
      title: "任务名称",
      description: "详细内容",
      status: "任务状态",
      tags: "标签",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "dueDate", "priority"],
  },
  tool: {
    tableId: "tbl5r4qZHGnFxUSC",
    tableName: "工具资源库",
    fieldMap: {
      name: "工具名称",
      description: "核心功能",
      category: "工具分类",
      url: "调用链接",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "tags"],
  },
  method: {
    tableId: "tbllqXDX0MbmUl07",
    tableName: "方法流程库",
    fieldMap: {
      title: "方法名称",
      content: "核心精要",
      status: "掌握状态",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "tags"],
  },
  document: {
    tableId: "tblfsL2sxubcpw0i",
    tableName: "文献库",
    fieldMap: {
      title: "标题",
      author: "作者/来源",
      abstract: "摘要/核心观点",
      tags: "核心词",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt"],
  },
  file: {
    tableId: "tblMWDRaRN2sY2kb",
    tableName: "文件管理",
    fieldMap: {
      filename: "文本",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "size", "mimeType", "url", "tags"],
  },
  calendar: {
    tableId: "tblxDBsdrChYhST8",
    tableName: "任务清单",
    fieldMap: {
      title: "任务标题",
      description: "任务内容",
      startTime: "任务开始时间",
      endTime: "任务截止时间",
      status: "任务状态",
      priority: "任务优先级",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "allDay", "reminder"],
  },
  ai_mechanism: {
    tableId: "tblBgV1gLsh22qbV",
    tableName: "AI Agent 机制库",
    fieldMap: {
      name: "机制名称",
      type: "所属组件",
      content: "核心理念",
      parameters: "详细关键特征",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt"],
  },
  library: {
    tableId: "tbl6WHGWD9DKLuJ5",
    tableName: "资源管理",
    fieldMap: {
      name: "资源名称",
      description: "资源详情",
      category: "资源类型",
      url: "获取链接",
      status: "资源状态",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt"],
  },
};

// ── Value converters ──────────────────────────────────────────

const STATUS_TO_FEISHU: Record<string, string> = {
  pending: "未处理",
  processing: "处理中",
  routed: "已炼化",
};

const FEISHU_TO_STATUS: Record<string, string> = {};
for (const [k, v] of Object.entries(STATUS_TO_FEISHU)) {
  FEISHU_TO_STATUS[v] = k;
}

const ROUTETARGET_TO_FEISHU: Record<string, string> = {
  task: "机缘录",
  method: "方法库",
  tool: "法器阁",
  library: "丹房",
  "ai-engine": "AI机制库",
};

const FEISHU_TO_ROUTETARGET: Record<string, string> = {};
for (const [k, v] of Object.entries(ROUTETARGET_TO_FEISHU)) {
  FEISHU_TO_ROUTETARGET[v] = k;
}

// ── Helpers ───────────────────────────────────────────────────

function isFeishuConfigured(): boolean {
  return !!(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET);
}

function toFeishuFields(tableKey: string, data: Record<string, unknown>): Record<string, unknown> {
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);
  const fields: Record<string, unknown> = {};
  for (const [localKey, feishuKey] of Object.entries(cfg.fieldMap)) {
    const val = data[localKey];
    if (val !== undefined) {
      let feishuVal = val;
      if (tableKey === "inbox") {
        if (localKey === "status") feishuVal = STATUS_TO_FEISHU[val as string] || val;
        if (localKey === "routeTarget") feishuVal = ROUTETARGET_TO_FEISHU[val as string] || val;
        if (localKey === "tags") feishuVal = Array.isArray(val) ? JSON.stringify(val) : val;
      }
      fields[feishuKey] = feishuVal;
    }
  }
  return fields;
}

function toLocalFields(tableKey: string, feishuFields: Record<string, unknown>): Record<string, unknown> {
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);
  const reverse: Record<string, string> = {};
  for (const [localKey, feishuKey] of Object.entries(cfg.fieldMap)) {
    reverse[feishuKey] = localKey;
  }
  const data: Record<string, unknown> = {};
  for (const [feishuKey, val] of Object.entries(feishuFields)) {
    const localKey = reverse[feishuKey];
    if (!localKey) continue;
    let localVal = val;
    if (tableKey === "inbox") {
      if (localKey === "status") localVal = FEISHU_TO_STATUS[val as string] || "pending";
      if (localKey === "routeTarget") localVal = FEISHU_TO_ROUTETARGET[val as string] || "";
      if (localKey === "tags") localVal = typeof val === "string" ? val : JSON.stringify(val || "");
    }
    // Convert arrays (MultiSelect/Attachment fields) to JSON string
    if (Array.isArray(localVal)) {
      localVal = JSON.stringify(localVal);
    }
    // Feishu URL field returns {link, text} object
    if (localVal && typeof localVal === "object" && "link" in (localVal as Record<string, unknown>)) {
      localVal = (localVal as Record<string, unknown>).link;
    }
    data[localKey] = localVal;
  }
  return data;
}

// ── Sync operations ──────────────────────────────────────────

/**
 * Create a record in Feishu. Returns the feishu record_id.
 */
export async function syncCreate(tableKey: string, data: Record<string, unknown>): Promise<string | null> {
  if (!isFeishuConfigured()) return null;
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);

  const fields = toFeishuFields(tableKey, data);
  const resp = await feishuRequest(
    "POST",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${cfg.tableId}/records`,
    { fields }
  );

  if (resp.code !== 0) {
    await logSync("push", cfg.tableName, "error", JSON.stringify(resp));
    throw new Error(`Feishu create failed: ${resp.msg}`);
  }

  await logSync("push", cfg.tableName, "success", `created ${resp.data?.record?.record_id}`);
  return resp.data?.record?.record_id ?? null;
}

/**
 * Update a record in Feishu by record_id.
 */
export async function syncUpdate(tableKey: string, feishuId: string, data: Record<string, unknown>): Promise<void> {
  if (!isFeishuConfigured()) return;
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);

  const fields = toFeishuFields(tableKey, data);
  const resp = await feishuRequest(
    "PUT",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${cfg.tableId}/records/${feishuId}`,
    { fields }
  );

  if (resp.code !== 0) {
    await logSync("push", cfg.tableName, "error", JSON.stringify(resp));
    console.error(`Feishu update failed: ${resp.msg}`);
  } else {
    await logSync("push", cfg.tableName, "success", `updated ${feishuId}`);
  }
}

/**
 * Delete a record from Feishu by record_id.
 */
export async function syncDelete(tableKey: string, feishuId: string): Promise<void> {
  if (!isFeishuConfigured()) return;
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);

  const resp = await feishuRequest(
    "DELETE",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${cfg.tableId}/records/${feishuId}`
  );

  if (resp.code !== 0) {
    await logSync("push", cfg.tableName, "error", JSON.stringify(resp));
    console.error(`Feishu delete failed: ${resp.msg}`);
  } else {
    await logSync("push", cfg.tableName, "success", `deleted ${feishuId}`);
  }
}

/**
 * Helper: after local create, sync to Feishu and update local feishuId.
 * Returns the feishuId if successful, null otherwise.
 */
export async function syncAfterCreate(
  tableKey: string,
  localId: string,
  data: Record<string, unknown>,
  saveFeishuId: (feishuId: string) => Promise<void>
): Promise<string | null> {
  try {
    const feishuId = await syncCreate(tableKey, data);
    if (feishuId) {
      await saveFeishuId(feishuId);
    }
    return feishuId;
  } catch (e) {
    console.error(`[feishu-sync] create ${tableKey}/${localId} failed:`, e);
    return null;
  }
}

/**
 * Helper: after local update, sync to Feishu if feishuId exists.
 */
export async function syncAfterUpdate(
  tableKey: string,
  feishuId: string | null,
  data: Record<string, unknown>
): Promise<void> {
  if (!feishuId) return;
  try {
    await syncUpdate(tableKey, feishuId, data);
  } catch (e) {
    console.error(`[feishu-sync] update ${tableKey}/${feishuId} failed:`, e);
  }
}

/**
 * Helper: after local delete, delete from Feishu if feishuId exists.
 */
export async function syncAfterDelete(tableKey: string, feishuId: string | null): Promise<void> {
  if (!feishuId) return;
  try {
    await syncDelete(tableKey, feishuId);
  } catch (e) {
    console.error(`[feishu-sync] delete ${tableKey}/${feishuId} failed:`, e);
  }
}

// ── Import / Pull ─────────────────────────────────────────────

export interface PullResult {
  table: string;
  tableName: string;
  imported: number;
  errors: number;
}

/**
 * Pull all records from a Feishu table and upsert into local DB.
 */
export async function pullTable(tableKey: string): Promise<PullResult> {
  const cfg = tables[tableKey];
  if (!cfg) throw new Error(`Unknown table: ${tableKey}`);

  let imported = 0;
  let errors = 0;

  const resp = await feishuRequest(
    "GET",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${cfg.tableId}/records?page_size=500`
  );

  if (resp.code !== 0) {
    await logSync("pull", cfg.tableName, "error", JSON.stringify(resp));
    return { table: tableKey, tableName: cfg.tableName, imported: 0, errors: 1 };
  }

  const items = resp.data?.items ?? [];
  for (const item of items) {
    try {
      const fields = toLocalFields(tableKey, item.fields ?? {});
      await upsertLocalRecord(tableKey, item.record_id, fields);
      imported++;
    } catch (e) {
      errors++;
      console.error(`[feishu-sync] import ${tableKey}/${item.record_id} failed:`, e);
    }
  }

  await logSync("pull", cfg.tableName, "success", `imported ${imported}, errors ${errors}`);
  return { table: tableKey, tableName: cfg.tableName, imported, errors };
}

async function upsertLocalRecord(tableKey: string, feishuId: string, fields: Record<string, unknown>) {
  const base = { ...fields, feishuId };

  switch (tableKey) {
    case "inbox":
      await prisma.inboxItem.upsert({
        where: { id: (fields.title as string) || feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, title: (fields.title as string) || "", content: (fields.content as string) || "", source: (fields.source as string) || "feishu", tags: (fields.tags as string) || "[]", imageUrls: (fields.imageUrls as string) || "[]", feishuId },
      });
      break;
    case "task":
      await prisma.task.upsert({
        where: { id: feishuId },
        update: { title: (fields.title as string) || "", description: (fields.description as string) || "", status: (fields.status as string) || "todo", action: (fields.action as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, title: (fields.title as string) || "", description: (fields.description as string) || "", tags: (fields.tags as string) || "[]", feishuId },
      });
      break;
    case "tool":
      await prisma.tool.upsert({
        where: { id: feishuId },
        update: { name: (fields.name as string) || "", description: (fields.description as string) || "", category: (fields.category as string) || "", url: (fields.url as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, name: (fields.name as string) || "", description: (fields.description as string) || "", tags: (fields.tags as string) || "[]", feishuId },
      });
      break;
    case "method":
      await prisma.method.upsert({
        where: { id: feishuId },
        update: { title: (fields.title as string) || "", essence: (fields.essence as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, title: (fields.title as string) || "", tags: (fields.tags as string) || "[]", feishuId },
      });
      break;
    case "document":
      await prisma.document.upsert({
        where: { id: feishuId },
        update: { title: (fields.title as string) || "", abstract: (fields.abstract as string) || "", author: (fields.author as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, title: (fields.title as string) || "", tags: (fields.tags as string) || "[]", feishuId },
      });
      break;
    case "file":
      await prisma.fileAsset.upsert({
        where: { id: feishuId },
        update: { filename: (fields.filename as string) || "", size: (fields.size as number) || 0, mimeType: (fields.mimeType as string) || "", url: (fields.url as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, filename: (fields.filename as string) || "", size: 0, mimeType: "", url: "", tags: "[]", feishuId },
      });
      break;
    case "calendar":
      await prisma.calendarEvent.upsert({
        where: { id: feishuId },
        update: { title: (fields.title as string) || "", description: (fields.description as string) || "", feishuId },
        create: { id: feishuId, title: (fields.title as string) || "", startTime: (fields.startTime as string) || "", feishuId },
      });
      break;
    case "ai_mechanism":
      await prisma.aiMechanism.upsert({
        where: { id: feishuId },
        update: { name: (fields.name as string) || "", component: (fields.component as string) || "", coreIdea: (fields.coreIdea as string) || "", tags: (fields.tags as string) || "[]", feishuId },
        create: { id: feishuId, name: (fields.name as string) || "", feishuId },
      });
      break;
    case "library":
      await prisma.metric.upsert({
        where: { id: feishuId },
        update: { name: (fields.name as string) || "", value: (fields.value as number) || 0, unit: (fields.unit as string) || "", category: (fields.category as string) || "", feishuId },
        create: { id: feishuId, name: (fields.name as string) || "", value: 0, feishuId },
      });
      break;
  }
}

// ── Logging ───────────────────────────────────────────────────

async function logSync(direction: string, tableName: string, status: string, detail: string) {
  try {
    await prisma.feishuSyncLog.create({
      data: { direction, tableName, status, detail },
    });
  } catch {
    // logging failure shouldn't break the main flow
  }
}

// ── Config check ──────────────────────────────────────────────

export { isFeishuConfigured, tables, APP_TOKEN };
