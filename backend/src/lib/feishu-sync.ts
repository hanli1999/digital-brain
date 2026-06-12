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
      title: "title",
      source: "source",
      tags: "keywords",        // Feishu field is "keywords"
      status: "status",
      routeTarget: "routeTarget",
      routedTo: "routedTo",
      aiSummary: "aiSummary",
      mood: "mood",
      collectedAt: "collectedAt",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "imageUrls", "sourceUrl"],
  },
  task: {
    tableId: "tblOyyByZYtZz7dA",
    tableName: "任务管理",
    fieldMap: {
      title: "title",
      description: "description",
      action: "action",
      status: "status",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "dueDate", "priority", "tags"],
  },
  tool: {
    tableId: "tbl5r4qZHGnFxUSC",
    tableName: "工具资源库",
    fieldMap: {
      name: "name",
      url: "url",
      corePower: "corePower",
      initScript: "initScript",
      rating: "rating",
      record: "record",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "category", "description", "tags"],
  },
  method: {
    tableId: "tbllqXDX0MbmUl07",
    tableName: "方法流程库",
    fieldMap: {
      title: "title",
      essence: "essence",
      learnedDate: "learnedDate",
      related: "related",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "content", "status", "type", "storage", "tags"],
  },
  document: {
    tableId: "tblfsL2sxubcpw0i",
    tableName: "文献库",
    fieldMap: {
      title: "title",
      author: "author",
      abstract: "abstract",
      importance: "importance",
      publishedAt: "publishedAt",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "url", "keywords", "type", "status", "snippet", "tags"],
  },
  file: {
    tableId: "tblMWDRaRN2sY2kb",
    tableName: "文件管理",
    fieldMap: {
      filename: "text",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "size", "mimeType", "url", "tags", "attachment", "date"],
  },
  calendar: {
    tableId: "tblxDBsdrChYhST8",
    tableName: "任务清单",
    fieldMap: {
      title: "title",
      startTime: "startTime",
      endTime: "endTime",
      status: "status",
      priority: "priority",
      projectId: "projectId",
      allDay: "allDay",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "description", "content", "reminder"],
  },
  ai_mechanism: {
    tableId: "tblBgV1gLsh22qbV",
    tableName: "AI Agent 机制库",
    fieldMap: {
      name: "name",
      coreIdea: "coreIdea",
      featuresDetail: "featuresDetail",
      scenariosDetail: "scenariosDetail",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "component", "features", "examples", "scenarios", "source", "tags", "type", "content", "parameters"],
  },
  library: {
    tableId: "tbl6WHGWD9DKLuJ5",
    tableName: "资源管理",
    fieldMap: {
      name: "name",
      detail: "detail",
      stock: "stock",
      url: "url",
      type: "type",
      status: "status",
    },
    skipFields: ["id", "feishuId", "createdAt", "updatedAt", "description", "category", "usedAt", "tags"],
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
    // Feishu returns timestamps/numbers, but Prisma schema stores as String
    if (typeof localVal === "number") {
      localVal = String(localVal);
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
        where: { id: feishuId },
        update: { ...base, id: undefined, content: fields.title as string || (fields.content as string) || "" },
        create: { id: feishuId, title: (fields.title as string) || "", content: (fields.content as string) || (fields.title as string) || "", source: (fields.source as string) || "feishu", tags: (fields.tags as string) || "[]", imageUrls: "[]", mood: (fields.mood as string) || "", aiSummary: (fields.aiSummary as string) || "", collectedAt: (fields.collectedAt as string) || "", feishuId },
      });
      break;
    case "task":
      await prisma.task.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, title: (fields.title as string) || "", description: (fields.description as string) || "", action: (fields.action as string) || "", status: (fields.status as string) || "todo", tags: "[]", feishuId },
      });
      break;
    case "tool":
      await prisma.tool.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, name: (fields.name as string) || "", url: (fields.url as string) || "", corePower: (fields.corePower as string) || "", initScript: (fields.initScript as string) || "", rating: (fields.rating as string) || "", record: (fields.record as string) || "", description: "", category: "", tags: "[]", feishuId },
      });
      break;
    case "method":
      await prisma.method.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, title: (fields.title as string) || "", essence: (fields.essence as string) || "", learnedDate: (fields.learnedDate as string) || "", related: (fields.related as string) || "", status: "todo", type: "", storage: "", tags: "[]", feishuId },
      });
      break;
    case "document":
      await prisma.document.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, title: (fields.title as string) || "", author: (fields.author as string) || "", abstract: (fields.abstract as string) || "", importance: (fields.importance as string) || "", publishedAt: (fields.publishedAt as string) || "", url: "", keywords: "", type: "", status: "", snippet: "", tags: "[]", feishuId },
      });
      break;
    case "file":
      await prisma.fileAsset.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, filename: (fields.filename as string) || "", text: (fields.text as string) || "", size: 0, mimeType: "", url: "", date: "", tags: "[]", feishuId },
      });
      break;
    case "calendar":
      await prisma.calendarEvent.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, title: (fields.title as string) || "", startTime: (fields.startTime as string) || "2025-01-01", endTime: (fields.endTime as string) || "", description: "", content: "", status: "", priority: "", allDay: "", projectId: (fields.projectId as string) || "", feishuId },
      });
      break;
    case "ai_mechanism":
      await prisma.aiMechanism.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, name: (fields.name as string) || "", coreIdea: (fields.coreIdea as string) || "", featuresDetail: (fields.featuresDetail as string) || "", scenariosDetail: (fields.scenariosDetail as string) || "", component: "", features: "", examples: "", scenarios: "", source: "", tags: "[]", feishuId },
      });
      break;
    case "library":
      await prisma.resource.upsert({
        where: { id: feishuId },
        update: { ...base, id: undefined },
        create: { id: feishuId, name: (fields.name as string) || "", detail: (fields.detail as string) || "", stock: (fields.stock as string) || "", url: (fields.url as string) || "", type: (fields.type as string) || "", status: (fields.status as string) || "", tags: "[]", feishuId },
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
