let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getFeishuToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const resp = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await resp.json();
  cachedToken = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + (data.expire - 60) * 1000,
  };
  return cachedToken.token;
}

export async function feishuRequest(method: string, path: string, body?: unknown) {
  const token = await getFeishuToken();
  const resp = await fetch(`https://open.feishu.cn/open-apis${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.json();
}

const APP_TOKEN = "MDmcwLhJIiwpK5k5yuecRWu4nee";

export interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export async function listRecords(tableId: string, params?: Record<string, string>): Promise<FeishuRecord[]> {
  const query = new URLSearchParams(params || {});
  const data = await feishuRequest("GET", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records?${query.toString()}`);
  return (data?.data?.items as FeishuRecord[]) || [];
}

export async function getRecord(tableId: string, recordId: string): Promise<FeishuRecord | null> {
  const data = await feishuRequest("GET", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/${recordId}`);
  return (data?.data?.record as FeishuRecord) || null;
}

export async function createRecord(tableId: string, fields: Record<string, unknown>): Promise<FeishuRecord | null> {
  const data = await feishuRequest("POST", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records`, { fields });
  return (data?.data?.record as FeishuRecord) || null;
}

export async function updateRecord(tableId: string, recordId: string, fields: Record<string, unknown>): Promise<FeishuRecord | null> {
  const data = await feishuRequest("PUT", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/${recordId}`, { fields });
  return (data?.data?.record as FeishuRecord) || null;
}

export async function deleteRecord(tableId: string, recordId: string): Promise<boolean> {
  const data = await feishuRequest("DELETE", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/${recordId}`);
  return data?.code === 0;
}

// 飞书原生全文搜索（POST endpoint，与 GET listRecords 不同）
export async function searchRecords(tableId: string, search: string, pageSize = 50): Promise<FeishuRecord[]> {
  const data = await feishuRequest("POST", `/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/search`, {
    search,
    page_size: pageSize,
  });
  return (data?.data?.items as FeishuRecord[]) || [];
}
