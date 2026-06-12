import { Hono } from "hono";
import { searchRecords, listRecords } from "../lib/feishu.js";
import { toEnglish } from "../lib/field-map.js";

const SEARCH_TABLES: { key: string; tableId: string; titleField: string }[] = [
  { key: "inbox", tableId: "tbl2pG26LdF3c3cX", titleField: "title" },
  { key: "tasks", tableId: "tblOyyByZYtZz7dA", titleField: "detail" },
  { key: "tools", tableId: "tbl5r4qZHGnFxUSC", titleField: "name" },
  { key: "methods", tableId: "tbllqXDX0MbmUl07", titleField: "title" },
  { key: "library", tableId: "tblfsL2sxubcpw0i", titleField: "title" },
  { key: "ai-engine", tableId: "tblBgV1gLsh22qbV", titleField: "name" },
  { key: "resources", tableId: "tbl6WHGWD9DKLuJ5", titleField: "name" },
  { key: "files", tableId: "tblMWDRaRN2sY2kb", titleField: "text" },
];

const app = new Hono();

app.get("/", async (c) => {
  const q = (c.req.query("q") || "").trim();
  if (!q) return c.json([]);

  const tableResults = await Promise.all(
    SEARCH_TABLES.map(async ({ key, tableId, titleField }) => {
      try {
        // 优先用飞书原生搜索 API（POST records/search）
        let records = await searchRecords(tableId, q, 20);
        // 原生搜索失败时回退到拉全量+JS过滤
        if (records.length === 0) {
          records = await listRecords(tableId);
        }
        const mapped = await Promise.all(records.map((r) => toEnglish(tableId, r)));

        return mapped.map((record) => {
          const title = String(record[titleField] || record.id || "").trim() || "(无标题)";
          return {
            entityType: key,
            entityId: String(record.id || ""),
            title: title.length > 100 ? title.slice(0, 100) + "..." : title,
            content: title,
          };
        });
      } catch {
        return [];
      }
    })
  );

  const all = tableResults.flat();
  return c.json(all.slice(0, 20));
});

export default app;
