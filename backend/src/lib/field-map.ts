import { getFeishuToken } from "./feishu.js";

const APP_TOKEN = "MDmcwLhJIiwpK5k5yuecRWu4nee";

// English name → field_id
// All fields use English names internally. Chinese labels live only in the frontend.
// New fields discovered from Feishu API 2026-06-11.
const FIELD_ID_MAP: Record<string, Record<string, string>> = {
  // inbox — tbl2pG26LdF3c3cX (今日收件箱)
  tbl2pG26LdF3c3cX: {
    title: "fldaPxqOF4",           // 收集内容
    attachment: "fldE5QF9Uq",      // 附件
    content: "fldnGu4RSo",         // 附件识别结果 (OCR)
    status: "fld9dBk61S",          // 处理状态
    category: "fldTtoL1l7",        // 初步分类
    aiSummary: "fldORL7Jtq",       // 炼化结果
    tags: "fld4IUqBAx",            // 核心词
    mood: "fldR4wMwTn",            // 情绪色
    routeTarget: "fldapIbkWd",     // 归入建议
    toInsight: "fld5HlD7mr",       // 入机缘录 (button)
    toMethod: "fldZMnkUCV",        // 入方法库 (button)
    toResource: "fld9mELNI5",      // 入丹房 (button)
    toTool: "fldFP2zQZq",          // 入法器阁 (button)
    toAiEngine: "fldAb0QXv8",      // 入AI机制库 (button)
    routedTo: "fldKmo5qnH",        // 归位去处 (target record ID)
    source: "fldDEi7xIl",          // 来源
    collectedAt: "fldmm3NWHg",     // 收集时间
    sourceUrl: "fld6MtrC7V",       // 来源URL
    createdAt: "fld2sJVRuY",       // 创建时间
    daysSince: "fld6U0jLRj",       // 距今天数
    weight: "fldIEFFGxD",          // 时间权重分
  },

  // inspiration (机缘录) — tblOyyByZYtZz7dA
  tblOyyByZYtZz7dA: {
    detail: "fldeUiDsit",          // 机缘详情
    description: "fldXkJZCcB",     // 详细描述
    status: "fldGWvpqeZ",          // 机缘状态
    action: "fldbLgZZG6",          // 转化行动
    tags: "fldsZk8buT",            // 核心词/标签
    relatedMethod: "fld2rWbdCQ",   // 关联功法
    actionLog: "fld7BDKrbv",       // 行动记录
    recordId: "fldoJ3KzPl",        // 记录ID
  },

  // tools — tbl5r4qZHGnFxUSC (工具资源库/法器阁)
  tbl5r4qZHGnFxUSC: {
    name: "fld2ggJ1P4",            // 工具名称 (AI 提取)
    url: "fldBNH0HrU",             // 调用链接 (AI 提取)
    category: "fldGO7l17A",        // 工具类型 (AI 分类)
    corePower: "fldvYxtfzA",       // 核心能力 (AI 总结)
    initScript: "fldoFOI2YZ",      // 祭炼口诀/使用脚本 (AI 总结)
    rating: "fldvp14bZP",          // 威力评级 (手动)
    record: "fldYC36Yim",          // 法器记录 (原始内容，入库时写入)
    recordId: "fldYA736fL",        // 记录 ID (自动)
    relatedResource: "fldKW5xP8s", // 关联丹房资源 (手动)
  },

  // methods — tbllqXDX0MbmUl07 (方法流程库/功法库)
  tbllqXDX0MbmUl07: {
    title: "fldoItc6YV",           // 方法名称
    essence: "fldhc4KkQT",         // 核心精要 (AI 生成)
    status: "fldF2VFah1",          // 掌握状态
    type: "fldrLZkqVx",            // 方法类型 (AI 生成)
    learnedDate: "fldpPgQeQp",     // 领悟日期
    storage: "fldxZ100XH",         // 存放位置 (手动)
    related: "fld1h1IYI0",         // 推荐关联 (AI 生成)
    relatedTools: "fldtwHBiUf",    // 关联法器
    relatedMaterials: "fldueERkH7", // 关联丹材
    relatedInsights: "fldnz3f5sx", // 关联机缘
    recordId: "fld0zNAmbt",        // 记录 ID
  },

  // library — tblfsL2sxubcpw0i (文献库/丹房)
  tblfsL2sxubcpw0i: {
    title: "fldhfzggNU",           // 标题
    author: "fldOfRLRMB",          // 作者/来源
    attachment: "fld5iwznMA",      // 原文附件 (手动上传)
    url: "fldxiqRrHS",             // 原文链接
    abstract: "fld3kgBNyr",        // 摘要/核心观点
    keywords: "fldGNdarGd",        // 核心词
    type: "fldA9LI545",            // 文献类型 (AI 生成)
    status: "fldmHoFhzj",          // 阅读状态
    importance: "fldvqB7gej",      // 重要度
    ingestedAt: "fld4qrturJ",      // 入库时间
    publishedAt: "fldn1xE834",     // 发表日期
    snippet: "fldHLgmZZf",         // 原文片段
    relatedInsights: "fldTA05kWh", // 关联机缘
    relatedMethods: "fld19nRFGL",  // 关联功法
    relatedResources: "fldQgFCOku", // 关联丹房
  },

  // ai-engine — tblBgV1gLsh22qbV (AI Agent库/AI机制库)
  tblBgV1gLsh22qbV: {
    name: "fldh9SGhzw",            // 机制名称 (AI 生成)
    component: "fld9uhQYmk",       // 所属组件 (AI 生成)
    coreIdea: "fld8nmhy2o",        // 核心理念 (AI 生成)
    features: "fldRJoXBAA",        // 关键特征 (AI 生成)
    featuresDetail: "fld7dQKVhm",  // 详细关键特征 (AI 生成)
    examples: "fldT3Zvgbr",        // 实践示例 (AI 生成)
    scenarios: "fldWp3BlWE",       // 适用场景 (AI 生成)
    scenariosDetail: "fldpR0QU67", // 详细适用场景 (AI 生成)
    source: "fldTXLkq7F",          // 来源 (AI 生成)
    rawContent: "fldH0xCrZN",      // 原始内容 (入库时写入，喂给 AI)
    createdAt: "fld0xU6Jjg",       // 创建时间
    updatedAt: "fldQ3HCeBq",       // 最后更新时间
    recordId: "fldhYTHRqD",        // 记录 ID
  },

  // resources — tbl6WHGWD9DKLuJ5 (资源管理/丹房)
  tbl6WHGWD9DKLuJ5: {
    name: "fldB73zECM",            // 资源名称
    url: "fldNHUEcA2",             // 获取链接 (手动)
    type: "fldOK93Q6A",            // 资源类型 (AI 生成)
    stock: "fldkYDzgxJ",           // 当前存量 (手动)
    status: "fldOPAUCjd",          // 资源状态 (手动)
    detail: "fldTvS9Sbi",          // 资源详情 (手动)
    usageLog: "fldcpScyJY",        // 使用记录 (手动)
    usedAt: "flddwcjn6T",          // 使用时间 (自动)
    recordId: "fldaJbcK3w",        // 记录 ID
    relatedMethods: "fld4sqFOQf",  // 方法库关联
  },

  // files — tblMWDRaRN2sY2kb (文件管理)
  tblMWDRaRN2sY2kb: {
    text: "fldqe63Loj",            // 文本
    date: "fldP3dNrqC",            // 时间
    attachment: "flds7L6tSf",      // 附件
  },

  // calendar — tblxDBsdrChYhST8 (日程，滴答清单连接器同步)
  tblxDBsdrChYhST8: {
    taskId: "fld25qloFO",          // 任务 ID
    title: "fld04bF1H0",           // 任务标题
    allDay: "fld1c6N9Ek",          // 是否为全天任务
    projectId: "fld7nrQNXb",       // 所属项目 ID
    content: "fldJBYLk3t",         // 任务内容
    description: "fldU4hvOcZ",     // 任务描述
    timezone: "fldAdZ9ZCl",        // 时区信息
    repeatFlag: "fldXS3c07R",      // 任务的重复标记
    startTime: "fldKXUXVFn",       // 任务开始时间
    endTime: "fldQuPEqXP",         // 任务截止时间
    reminder: "fld5xpOpRy",        // 提醒
    priority: "fldulZY0am",        // 任务优先级
    status: "fldRKh4nwG",          // 任务状态
    completedAt: "fldQ8llfOu",     // 任务完成时间
    sort: "fldmIq1sAy",            // 排序
    subtasks: "fldMlIsZcU",        // 子任务列表
  },
};

// Cache: tableId → { fieldApiName → englishName }
const cache = new Map<string, Record<string, string>>();

async function loadFieldMap(tableId: string): Promise<Record<string, string>> {
  if (cache.has(tableId)) return cache.get(tableId)!;

  const enToFid = FIELD_ID_MAP[tableId] || {};
  const token = await getFeishuToken();
  const resp = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/fields`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  const fields: { field_id: string; field_name: string }[] = data?.data?.items || [];

  // Build: field_name (from API, possibly garbled) → english_name
  // Matching by field_id ensures we survive garbled Chinese field names
  const nameToEn: Record<string, string> = {};
  for (const f of fields) {
    for (const [en, fid] of Object.entries(enToFid)) {
      if (f.field_id === fid) {
        nameToEn[f.field_name] = en;
        break;
      }
    }
  }

  cache.set(tableId, nameToEn);
  return nameToEn;
}

export async function toEnglish(tableId: string, record: { record_id: string; fields: Record<string, unknown> }) {
  const map = await loadFieldMap(tableId);
  const result: Record<string, unknown> = { id: record.record_id };
  for (const [key, value] of Object.entries(record.fields)) {
    const en = map[key];
    if (en) {
      result[en] = value;
    }
  }
  return result;
}

export async function toFeishuFields(tableId: string, input: Record<string, unknown>) {
  const map = await loadFieldMap(tableId);
  // Reverse: english_name → api_field_name (the possibly-garbled name that Feishu API accepts)
  const enToApiName: Record<string, string> = {};
  for (const [apiName, en] of Object.entries(map)) {
    enToApiName[en] = apiName;
  }
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const apiName = enToApiName[key];
    if (apiName) fields[apiName] = value;
  }
  return fields;
}
