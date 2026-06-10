import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.JWT_SECRET || randomBytes(32).toString("hex");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

export function signToken(payload: { userId: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 })
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}
