// 入库目标映射：收件箱 routeTarget → 目标模块 + 字段映射
// 全部走 Prisma/SQLite

export interface RouteTarget {
  dbTable: string;
  label: string;
  fieldMap: Record<string, string>; // inbox字段 → 目标字段
}

// AI parse-card 返回的中文名 → 模块 key
export const AI_TARGET_MAP: Record<string, string> = {
  "收件箱": "inbox",
  "机缘录": "jiyuanlu",
  "法器阁": "tools",
  "工具资源库": "tools",
  "功法库": "methods",
  "方法流程库": "methods",
  "文献库": "library",
  "丹房": "library",
  "资源管理": "resources",
  "AI引擎库": "ai-engine",
  "AI Agent库": "ai-engine",
  "洞察": "insight",
  "文件管理": "files",
  "日程": "calendar",
  "任务清单": "calendar",
};

export const ROUTE_TARGETS: Record<string, RouteTarget> = {
  inbox: {
    dbTable: "inbox",
    label: "收件箱",
    fieldMap: {},
  },
  jiyuanlu: {
    dbTable: "jiyuanlu",
    label: "机缘录",
    fieldMap: { content: "detail", tags: "tags" },
  },
  tools: {
    dbTable: "tools",
    label: "工具资源库",
    fieldMap: { content: "record", category: "category" },
  },
  methods: {
    dbTable: "methods",
    label: "方法流程库",
    fieldMap: { title: "title", content: "essence", category: "type" },
  },
  library: {
    dbTable: "library",
    label: "文献库",
    fieldMap: { title: "title", content: "abstract", category: "type" },
  },
  resources: {
    dbTable: "resources",
    label: "资源管理",
    fieldMap: { title: "name", content: "detail", category: "type" },
  },
  "ai-engine": {
    dbTable: "ai-engine",
    label: "AI Agent库",
    fieldMap: { content: "rawContent", category: "component" },
  },
  files: {
    dbTable: "files",
    label: "文件管理",
    fieldMap: { content: "text" },
  },
  calendar: {
    dbTable: "calendar",
    label: "日程",
    fieldMap: { title: "title", content: "content" },
  },
  insight: {
    dbTable: "insight",
    label: "洞察",
    fieldMap: { title: "title", content: "content", category: "category" },
  },
};

export function resolveTarget(aiRouteTarget: string): string | null {
  return AI_TARGET_MAP[aiRouteTarget] || null;
}
