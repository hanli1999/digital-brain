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
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.json();
}
