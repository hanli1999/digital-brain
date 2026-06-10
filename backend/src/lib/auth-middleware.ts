import type { Context, Next } from "hono";
import { verifyToken } from "./auth.js";

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!auth) return c.json({ error: "未登录" }, 401);
  const payload = verifyToken(auth);
  if (!payload) return c.json({ error: "Token 无效或已过期" }, 401);
  c.set("userId", payload.userId);
  c.set("username", payload.username);
  await next();
}
