// 入库目标映射：收件箱 routeTarget → 目标模块表ID + 字段映射
// 注意：insight 走本地 Prisma/SQLite，不走飞书 API

export interface RouteTarget {
  tableId?: string;                     // Feishu 表ID（Prisma 模块无此字段）
  label: string;                        // 中文名
  fieldMap: Record<string, string>;     // inbox字段 → 目标字段
  prismaModel?: string;                 // Prisma 模型名（insight 用）
}

// AI parse-card 返回的中文名 → 模块 key
export const AI_TARGET_MAP: Record<string, string> = {
  "收件箱": "inbox",
  "任务管理": "tasks",
  "机缘录": "tasks",          // 机缘录 Feishu 表
  "法器阁": "tools",
  "工具资源库": "tools",
  "功法库": "methods",
  "方法流程库": "methods",
  "文献库": "library",
  "丹房": "library",            // 丹房 = 文献库/资料库
  "资源管理": "resources",
  "AI引擎库": "ai-engine",
  "AI Agent库": "ai-engine",
  "洞察": "insight",          // 洞察走 Prisma/SQLite
  "文件管理": "files",
  "日程": "calendar",
  "任务清单": "calendar",
};

// RouteButton 前端 key → 后端 target
export const ROUTE_TARGETS: Record<string, RouteTarget> = {
  inbox: {
    label: "收件箱",
    fieldMap: {},
  },
  tasks: {
    tableId: "tblOyyByZYtZz7dA",
    label: "机缘录",
    // detail=机缘详情（原始内容），AI 生成 action/status
    fieldMap: { content: "detail", tags: "tags" },
  },
  // 字段映射说明：inbox 字段 → 目标表字段
  // 只写"原始内容"字段（给飞书 AI 喂料），AI 生成字段由飞书自动化填充
  tools: {
    tableId: "tbl5r4qZHGnFxUSC",
    label: "工具资源库",
    // record=法器记录（原始内容），AI 生成：name/url/corePower/initScript
    fieldMap: { content: "record", category: "category" },
  },
  methods: {
    tableId: "tbllqXDX0MbmUl07",
    label: "方法流程库",
    fieldMap: { title: "title", content: "essence", category: "type" },
  },
  library: {
    tableId: "tblfsL2sxubcpw0i",
    label: "文献库",
    fieldMap: { title: "title", content: "abstract", category: "type" },
  },
  resources: {
    tableId: "tbl6WHGWD9DKLuJ5",
    label: "资源管理",
    fieldMap: { title: "name", content: "detail", category: "type" },
  },
  "ai-engine": {
    tableId: "tblBgV1gLsh22qbV",
    label: "AI Agent库",
    // rawContent=原始内容（喂给飞书 AI），AI 生成：name/coreIdea/features 等
    fieldMap: { content: "rawContent", category: "component" },
  },
  files: {
    tableId: "tblMWDRaRN2sY2kb",
    label: "文件管理",
    fieldMap: { content: "text" },
  },
  calendar: {
    tableId: "tblxDBsdrChYhST8",
    label: "日程",
    fieldMap: { title: "title", content: "content" },
  },
  insight: {
    label: "洞察",
    fieldMap: { title: "title", content: "content", category: "category" },
    prismaModel: "insight",
  },
};

export function resolveTarget(aiRouteTarget: string): string | null {
  return AI_TARGET_MAP[aiRouteTarget] || null;
}
