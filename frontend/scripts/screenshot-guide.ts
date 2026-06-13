import { chromium } from "playwright";
import * as path from "node:path";

const BASE = "https://digital-brain-delta.vercel.app";
const API = "https://digital-brain-backend-production.up.railway.app/api";
const SCREENSHOT_DIR = path.resolve("public/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Register test user + get token for localStorage auth
  const username = `guide_${Date.now()}`;
  const password = "guide1234";
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const { token } = await res.json() as { token: string };
  console.log("Logged in as:", username);

  const page = await context.newPage();

  // Inject auth token before first navigation
  await page.goto(BASE);
  await page.evaluate((t) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify({ username: "guide_user" }));
  }, token);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 1. Dashboard
  console.log("1/8 Dashboard...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-dashboard.png"), fullPage: true });

  // 2. Inbox — before AI parse (fill input)
  console.log("2/8 Inbox before parse...");
  await page.goto(`${BASE}/inbox`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const textarea = page.locator("textarea").first();
  if (await textarea.isVisible()) {
    await textarea.fill("Gamma是一个AI驱动的PPT自动生成工具，可以在几分钟内创建专业演示文稿");
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-inbox-input.png"), fullPage: true });

  // 3. Inbox — after AI parse (click parse button if exists)
  console.log("3/8 Inbox after parse...");
  const parseBtn = page.locator("button").filter({ hasText: "解析" }).or(page.locator("button").filter({ hasText: "AI" }));
  if (await parseBtn.first().isVisible().catch(() => false)) {
    await parseBtn.first().click();
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-inbox-parsed.png"), fullPage: true });

  // 4. Tools (法器阁)
  console.log("4/8 Tools...");
  await page.goto(`${BASE}/tools`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-tools.png"), fullPage: true });

  // 5. Methods (功法库)
  console.log("5/8 Methods...");
  await page.goto(`${BASE}/methods`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-methods.png"), fullPage: true });

  // 6. Search results
  console.log("6/8 Search...");
  await page.goto(`${BASE}/search?q=AI`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-search.png"), fullPage: true });

  // 7. Inbox route — show the route dropdown open
  console.log("7/8 Inbox route...");
  await page.goto(`${BASE}/inbox`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const routeBtn = page.locator("button").filter({ hasText: "入库" }).first();
  if (await routeBtn.isVisible().catch(() => false)) {
    await routeBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-inbox-route.png"), fullPage: true });

  // 8. Dashboard panorama — show full pipeline context
  console.log("8/8 Full panorama...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-panorama.png"), fullPage: true });

  await browser.close();
  console.log("All 8 screenshots saved to", SCREENSHOT_DIR);
}

main().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
