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

export default app;
