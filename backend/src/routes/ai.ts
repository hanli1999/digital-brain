import { Hono } from "hono";

const app = new Hono();

const PARSE_SYSTEM = `你是一个知识管理助手。用户把碎片信息丢给你，你将其"炼化"为结构化的收件箱卡片。

## 拆分规则（最高优先级，违反即错误）

凡出现以下任一种"拆分信号"，必须拆成多条 parsed 卡片：

1. **连接词**："还有" "另外" "另外还有" "另外，" "此外" "同时" → 拆分
2. **不同领域**：一个工具+一个抽象想法 → 拆分
3. **任务+感悟并存**：有时间/任务的行动项 + 感悟/想法 → 拆分
4. **每个工具名**各一条卡片

**Examples（必须对照执行）：**

输入："用飞书做知识库，另外n8n也值得学"
→ parsed: [飞书知识库卡片, n8n学习卡片]  ← 2条！

输入："周五前完成Prisma迁移文档。还有，AI正在改变编程方式"
→ parsed: [Prisma迁移任务卡片, AI改变编程感悟卡片]  ← 2条！

输入："发现Playwright可以做自动化测试"
→ parsed: [Playwright工具卡片]  ← 1条（无拆分信号）

只有完全没拆分信号时才返回 1 条。上限 5 条。

## 逐条字段

- title: 精炼标题（≤15字），让人一眼知道这是什么
- category: "待办任务或行动" | "个人感悟或灵感" | "有用工具或资源" | "参考资料或文献" | "其他"
- tags: 2-6 个关键词标签
- routeTarget: "法器阁" | "功法库" | "机缘录" | "丹房" | "方法库"
- mood: "兴奋" | "平静" | "焦虑" | "好奇"
- abstract: 80-250 字炼化笔记：说清核心内容 + 为什么重要 + 能怎么用
- suggestion: 一句话行动建议
- confidence: 0.0-1.0 数字。每个字段都有明确信息=0.9+，信息模糊=0.5-

## 路由规则

| 信号 | routeTarget | category |
|------|-------------|----------|
| 具体工具/软件/脚本/平台名 | 法器阁 | 有用工具或资源 |
| "学"/"练"/"做"/"完成"/"搞定"/截止日期 | 功法库 | 待办任务或行动 |
| 灵感/想法/思考/观察/感悟/反思 | 机缘录 | 个人感悟或灵感 |
| 资料/文献/文章/书/链接/论文 | 丹房 | 参考资料或文献 |
| 方法/流程/技巧/口诀/步骤 | 方法库 | 有用工具或资源 |
| 无法判断 | 机缘录 | 其他 |

## 输出格式

纯 JSON（不要 markdown 代码块）：

{
  "parsed": [
    {
      "title": "...",
      "category": "...",
      "tags": ["...", "..."],
      "routeTarget": "...",
      "mood": "...",
      "abstract": "...",
      "suggestion": "...",
      "confidence": 0.9
    }
  ]
}`;

// POST /api/ai — generic AI proxy (DeepSeek)
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

// POST /api/ai/parse-card — 炼化一段文字为结构化卡片（支持多实体拆分）
app.post("/parse-card", async (c) => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return c.json({ error: "No API key configured" }, 400);

  const { text } = await c.req.json();
  if (!text || typeof text !== "string") return c.json({ error: "text required" }, 400);

  // Pre-split text on Chinese separator words before sending to AI.
  // DeepSeek Chat tends to merge; code-level splitting is more reliable.
  const SPLIT_RE = /(?:另外还有|另外，|另外|还有，|还有|此外，|此外|同时，|同时)(?=\s*[^\s])/g;
  const roughSegments = text.split(SPLIT_RE).map((s: string) => s.trim()).filter(Boolean);

  async function parseOne(segment: string) {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: PARSE_SYSTEM },
          { role: "user", content: segment },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });
    const data = await resp.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data?.choices?.[0]?.message?.content || "";
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const item = JSON.parse(clean);
      return item;
    } catch {
      return null;
    }
  }

  console.log(`[parse-card] text len=${text.length}, segments=${roughSegments.length}, segs=${JSON.stringify(roughSegments.map((s:string)=>s.slice(0,30)))}`);

  if (roughSegments.length > 1) {
    // Parse each segment independently then combine
    console.log(`[parse-card] MULTI-SPLIT: ${roughSegments.length} segments`);
    const results = await Promise.all(roughSegments.map(parseOne));
    const parsed = results
      .filter(Boolean)
      .map((item: any) => {
        if (typeof item.confidence !== "number") item.confidence = 0.7;
        return item;
      });
    return c.json({ parsed });
  }

  // Single segment: use existing flow
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
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(clean);

    if (!result.parsed && result.title) {
      result.parsed = [result];
    }
    if (!result.parsed) {
      result.parsed = [];
    }

    for (const item of result.parsed) {
      if (typeof item.confidence !== "number") item.confidence = 0.7;
    }

    return c.json(result);
  } catch {
    return c.json({ error: "Parse failed", raw }, 500);
  }
});

export default app;
