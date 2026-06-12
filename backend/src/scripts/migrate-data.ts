// One-shot: pull all Feishu template data → Prisma local DB
import { listRecords } from "../lib/feishu.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "link" in (v as any)) return (v as any).link || "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

async function migrateTable(
  feishuTableId: string,
  dbTable: string,
  fieldMap: Record<string, string>,  // Feishu field_name → Prisma field
  requiredField?: string,             // fallback if empty
) {
  const records = await listRecords(feishuTableId, { page_size: "200" });
  console.log(`${dbTable}: ${records.length} records from Feishu → `);

  let ok = 0, fail = 0;
  for (const r of records) {
    const f = r.fields;
    const data: Record<string, unknown> = { feishuId: r.record_id };

    for (const [feishuName, prismaField] of Object.entries(fieldMap)) {
      const val = f[feishuName];
      if (val !== undefined && val !== null) {
        data[prismaField] = str(val);
      }
    }

    // Ensure at least one identifying field is set
    if (requiredField && !data[requiredField]) {
      data[requiredField] = "未命名";
    }

    // CalendarEvent requires startTime (Feishu stores as timestamp number)
    if (dbTable === "calendarEvent" && !data["startTime"]) {
      data["startTime"] = "2025-01-01";
    }

    try {
      await (prisma as any)[dbTable].upsert({
        where: { id: r.record_id },
        update: data,
        create: { id: r.record_id, ...data },
      });
      ok++;
    } catch (err: any) {
      fail++;
      if (fail <= 2) {
        const keys = Object.keys(data).join(",");
        console.error(`  FAIL ${r.record_id}: ${err.message?.slice(0, 100)} | keys: ${keys}`);
      }
    }
  }
  console.log(`  → ${ok} ok, ${fail} fail`);
  return ok;
}

// Field maps: Feishu Chinese field name → Prisma model field
// Use the Chinese names directly (same as in template)
const tables = [
  {
    feishuTableId: "tbl2pG26LdF3c3cX",
    dbTable: "inboxItem",
    fieldMap: {
      "收集内容": "title", "附件识别结果": "content", "来源": "source",
      "处理状态": "status", "初步分类": "category", "归入建议": "routeTarget",
      "归位去处": "routedTo", "核心词": "tags", "炼化结果": "aiSummary",
      "情绪色": "mood", "收集时间": "collectedAt", "来源URL": "sourceUrl",
      "附件": "imageUrls",
    },
    required: "title",
  },
  {
    feishuTableId: "tblOyyByZYtZz7dA",
    dbTable: "task",
    fieldMap: {
      "任务名称": "title", "详细内容": "description", "任务状态": "status",
      "标签": "tags", "转化行动": "action",
    },
    required: "title",
  },
  {
    feishuTableId: "tbl5r4qZHGnFxUSC",
    dbTable: "tool",
    fieldMap: {
      "工具名称": "name", "调用链接": "url", "工具类型": "category",
      "核心能力": "corePower", "祭炼口诀/使用脚本": "initScript",
      "威力评级": "rating", "法器记录": "record",
    },
    required: "name",
  },
  {
    feishuTableId: "tbllqXDX0MbmUl07",
    dbTable: "method",
    fieldMap: {
      "方法名称": "title", "核心精要": "essence", "掌握状态": "status",
      "方法类型": "type", "领悟日期": "learnedDate", "存放位置": "storage",
      "推荐关联": "related",
    },
    required: "title",
  },
  {
    feishuTableId: "tblfsL2sxubcpw0i",
    dbTable: "document",
    fieldMap: {
      "标题": "title", "作者/来源": "author", "原文链接": "url",
      "摘要/核心观点": "abstract", "核心词": "keywords", "文献类型": "type",
      "阅读状态": "status", "重要度": "importance", "发表日期": "publishedAt",
      "原文片段": "snippet", "标签": "tags",
    },
    required: "title",
  },
  {
    feishuTableId: "tblBgV1gLsh22qbV",
    dbTable: "aiMechanism",
    fieldMap: {
      "机制名称": "name", "所属组件": "component", "核心理念": "coreIdea",
      "关键特征": "features", "详细关键特征": "featuresDetail",
      "实践示例": "examples", "适用场景": "scenarios",
      "详细适用场景": "scenariosDetail", "来源": "source",
    },
    required: "name",
  },
  {
    feishuTableId: "tbl6WHGWD9DKLuJ5",
    dbTable: "resource",
    fieldMap: {
      "资源名称": "name", "获取链接": "url", "资源类型": "type",
      "当前存量": "stock", "资源状态": "status", "资源详情": "detail",
    },
    required: "name",
  },
  {
    feishuTableId: "tblMWDRaRN2sY2kb",
    dbTable: "fileAsset",
    fieldMap: {
      "文本": "filename", "附件": "attachment", "时间": "date",
    },
    required: "filename",
  },
  {
    feishuTableId: "tblxDBsdrChYhST8",
    dbTable: "calendarEvent",
    fieldMap: {
      "任务标题": "title", "任务内容": "content", "任务描述": "description",
      "任务状态": "status", "任务优先级": "priority",
      "任务开始时间": "startTime", "任务截止时间": "endTime",
      "是否为全天任务": "allDay", "所属项目 ID": "projectId",
    },
    required: "title",
  },
  {
    feishuTableId: "tblOyyByZYtZz7dA",
    dbTable: "jiyuanlu",
    fieldMap: {
      "任务名称": "detail", "详细内容": "description", "任务状态": "status",
      "转化行动": "action", "标签": "tags",
    },
    required: "detail",
  },
];

async function main() {
  let total = 0;
  for (const t of tables) {
    total += await migrateTable(t.feishuTableId, t.dbTable, t.fieldMap, t.required);
  }
  console.log(`\nTotal: ${total} records migrated.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
