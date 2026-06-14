import type { Context, Next } from "hono";
import { tenantCtx } from "./prisma.js";

export async function tenantMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string | undefined;
  if (!userId) return next(); // auth middleware handles 401
  return tenantCtx.run({ userId }, () => next());
}
