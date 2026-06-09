import { Hono } from "hono";
import { feishuRequest } from "../lib/feishu.js";

const app = new Hono();

app.post("/", async (c) => {
  if (!process.env.FEISHU_APP_ID) return c.json({ error: "Feishu not configured" }, 400);
  const result = await feishuRequest("GET", "/bitable/v1/app");
  return c.json({ status: "sync_triggered", feishu: result });
});

export default app;
