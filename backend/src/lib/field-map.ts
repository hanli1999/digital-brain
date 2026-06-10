import { getFeishuToken } from "./feishu.js";

const APP_TOKEN = "MDmcwLhJIiwpK5k5yuecRWu4nee";

// English name → field_id → used to identify which field is which after API returns corrupted names
const FIELD_ID_MAP: Record<string, Record<string, string>> = {
  // tasks — tblOyyByZYtZz7dA
  tblOyyByZYtZz7dA: {
    title: "fldeUiDsit",
    description: "fldXkJZCcB",
    status: "fldGWvpqeZ",
    action: "fldbLgZZG6",
    tags: "fldsZk8buT",
  },
  // inbox — tbl2pG26LdF3c3cX
  tbl2pG26LdF3c3cX: {
    title: "fldaPxqOF4",
    content: "fldnGu4RSo",
    status: "fld9dBk61S",
    category: "fldTtoL1l7",
    tags: "fld4IUqBAx",
    source: "fldDEi7xIl",
    mood: "fldR4wMwTn",
    routeTarget: "fldapIbkWd",
    routedTo: "fldKmo5qnH",
    sourceUrl: "fld6MtrC7V",
    aiSummary: "fldORL7Jtq",
    collectedAt: "fldmm3NWHg",
    createdAt: "fld2sJVRuY",
  },
  // tools — tbl5r4qZHGnFxUSC
  tbl5r4qZHGnFxUSC: {
    name: "fld2ggJ1P4",
    url: "fldBNH0HrU",
    category: "fldGO7l17A",
    corePower: "fldvYxtfzA",
    initScript: "fldoFOI2YZ",
    rating: "fldvp14bZP",
    record: "fldYC36Yim",
  },
  // resources — tbl6WHGWD9DKLuJ5
  tbl6WHGWD9DKLuJ5: {
    name: "fldB73zECM",
    url: "fldNHUEcA2",
    type: "fldOK93Q6A",
    stock: "fldkYDzgxJ",
    status: "fldOPAUCjd",
    detail: "fldTvS9Sbi",
  },
  // methods — tbllqXDX0MbmUl07
  tbllqXDX0MbmUl07: {
    title: "fldoItc6YV",
    essence: "fldhc4KkQT",
    status: "fldF2VFah1",
    type: "fldrLZkqVx",
    learnedDate: "fldpPgQeQp",
    storage: "fldxZ100XH",
    related: "fld1h1IYI0",
  },
  // ai-engine — tblBgV1gLsh22qbV
  tblBgV1gLsh22qbV: {
    name: "fldh9SGhzw",
    component: "fld9uhQYmk",
    coreIdea: "fld8nmhy2o",
    features: "fldRJoXBAA",
    featuresDetail: "fld7dQKVhm",
    examples: "fldT3Zvgbr",
    scenarios: "fldWp3BlWE",
    scenariosDetail: "fldpR0QU67",
    source: "fldTXLkq7F",
    createdAt: "fld0xU6Jjg",
  },
  // library — tblfsL2sxubcpw0i
  tblfsL2sxubcpw0i: {
    title: "fldhfzggNU",
    author: "fldOfRLRMB",
    url: "fldxiqRrHS",
    abstract: "fld3kgBNyr",
    keywords: "fldGNdarGd",
    type: "fldA9LI545",
    status: "fldmHoFhzj",
    importance: "fldvqB7gej",
    publishedAt: "fldn1xE834",
    snippet: "fldHLgmZZf",
  },
  // files — tblMWDRaRN2sY2kb
  tblMWDRaRN2sY2kb: {
    text: "fldqe63Loj",
    date: "fldP3dNrqC",
    attachment: "flds7L6tSf",
  },
  // calendar — tblxDBsdrChYhST8
  tblxDBsdrChYhST8: {
    title: "fld04bF1H0",
    content: "fldJBYLk3t",
    description: "fldU4hvOcZ",
    status: "fldRKh4nwG",
    priority: "fldulZY0am",
    startTime: "fldKXUXVFn",
    endTime: "fldQuPEqXP",
    allDay: "fld1c6N9Ek",
    projectId: "fld7nrQNXb",
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

  // Build: field_name (from API, possibly corrupted) → english_name
  const nameToEn: Record<string, string> = {};
  for (const f of fields) {
    // Find english name by field_id
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
    result[map[key] || key] = value;
  }
  return result;
}

export async function toFeishuFields(tableId: string, input: Record<string, unknown>) {
  const map = await loadFieldMap(tableId);
  // Reverse: english_name → api_field_name (the corrupted one that the API accepts)
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
