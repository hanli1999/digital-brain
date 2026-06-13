import { Hono } from "hono";
import { PARSE_SYSTEM } from "../lib/parse-prompt.js";

const app = new Hono();

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
