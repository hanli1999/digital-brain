import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const { prompt, apiKey } = await c.req.json();
  const key = apiKey || process.env.DEEPSEEK_API_KEY;
  if (!key) return c.json({ error: "No API key configured" }, 400);

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }] }),
  });
  return c.json(await resp.json());
});

const PARSE_SYSTEM = `你是一个知识管理助手。用户会给你一段文字，你将其"炼化"为结构化的收件箱卡片。

输出必须是纯JSON（不要markdown代码块），格式如下：
{
  "title": "提炼的标题（15字以内）",
  "category": "待办任务或行动 | 个人感悟或灵感 | 有用工具或资源 | 其他",
  "tags": ["标签1", "标签2"],
  "routeTarget": "机缘录 | 功法库 | 法器阁 | 丹房 | 方法库",
  "mood": "兴奋 | 平静 | 焦虑 | 好奇",
  "abstract": "250字以内完整炼化结果，包含：核心内容概括、关键信息提取、潜在价值分析、可行动建议",
  "suggestion": "一句话建议，比如'建议归入法器阁并尽快试用'"
}

规则：
- 如果用户提到某个具体工具/软件 → category="有用工具或资源"，routeTarget="法器阁"
- 如果用户提到"学"、"练"、"做"、"完成" → category="待办任务或行动"，routeTarget="功法库"
- 如果用户提到灵感、想法、思考、观察到 → category="个人感悟或灵感"，routeTarget="机缘录"
- 如果用户提到资料、文献、文章、书 → category="有用工具或资源"，routeTarget="丹房"
- 如果无法判断，category="其他"，routeTarget="机缘录"
- tags至少2个，最多6个
- abstract不是简单重复标题——要像一条"炼化后的知识笔记"：说清这是什么、为什么重要、能怎么用
- mood根据内容语气判断
- 如果用户提到URL，保留在abstract中`;

app.post("/parse-card", async (c) => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return c.json({ error: "No API key configured" }, 400);

  const { text } = await c.req.json();
  if (!text || typeof text !== "string") return c.json({ error: "text required" }, 400);

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: PARSE_SYSTEM },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  const data = await resp.json() as { choices?: { message?: { content?: string } }[] };
  const raw = data?.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(raw.trim());
    return c.json(parsed);
  } catch {
    return c.json({ error: "Parse failed", raw }, 500);
  }
});

export default app;
