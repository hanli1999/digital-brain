import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../lib/auth.js";

const app = new Hono();

app.post("/register", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password || username.length < 2 || password.length < 4) {
    return c.json({ error: "用户名至少2位，密码至少4位" }, 400);
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return c.json({ error: "用户名已存在" }, 409);

  const user = await prisma.user.create({
    data: { username, passwordHash: hashPassword(password) },
  });
  await prisma.searchIndex.create({
    data: { entityType: "user", entityId: user.id, title: username, content: "" },
  });
  const token = signToken({ userId: user.id, username });
  return c.json({ user: { id: user.id, username }, token }, 201);
});

app.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return c.json({ error: "用户名或密码错误" }, 401);
  }
  const token = signToken({ userId: user.id, username });
  return c.json({ user: { id: user.id, username }, token });
});

app.get("/me", async (c) => {
  const auth = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!auth) return c.json({ error: "未登录" }, 401);
  const payload = verifyToken(auth);
  if (!payload) return c.json({ error: "Token 无效或已过期" }, 401);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  return c.json({ user: { id: user?.id, username: user?.username } });
});

export default app;
