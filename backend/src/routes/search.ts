import { Hono } from "hono";
import { listRecords } from "../lib/feishu.js";
import { toEnglish } from "../lib/field-map.js";

const SEARCH_TABLES: { key: string; tableId: string; titleField: string; searchFields: string[] }[] = [
  { key: "inbox", tableId: "tbl2pG26LdF3c3cX", titleField: "title", searchFields: ["title", "content", "aiSummary"] },
  { key: "tasks", tableId: "tblOyyByZYtZz7dA", titleField: "detail", searchFields: ["detail", "action", "description"] },
  { key: "tools", tableId: "tbl5r4qZHGnFxUSC", titleField: "name", searchFields: ["name", "corePower", "initScript", "record"] },
  { key: "methods", tableId: "tbllqXDX0MbmUl07", titleField: "title", searchFields: ["title", "essence"] },
  { key: "library", tableId: "tblfsL2sxubcpw0i", titleField: "title", searchFields: ["title", "abstract", "snippet", "keywords"] },
  { key: "ai-engine", tableId: "tblBgV1gLsh22qbV", titleField: "name", searchFields: ["name", "coreIdea", "features", "examples", "scenarios"] },
  { key: "resources", tableId: "tbl6WHGWD9DKLuJ5", titleField: "name", searchFields: ["name", "detail"] },
  { key: "files", tableId: "tblMWDRaRN2sY2kb", titleField: "text", searchFields: ["text"] },
];

const app = new Hono();

app.get("/", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  if (!q) return c.json([]);

  const tableResults = await Promise.all(
    SEARCH_TABLES.map(async ({ key, tableId, titleField, searchFields }) => {
      try {
        const records = await listRecords(tableId);
        const mapped = await Promise.all(records.map((r) => toEnglish(tableId, r)));

        return mapped
          .filter((record) => {
            for (const sf of searchFields) {
              const v = record[sf];
              if (typeof v === "string" && v.toLowerCase().includes(q)) return true;
            }
            return false;
          })
          .map((record) => {
            const title = String(record[titleField] || "").trim() || "(无标题)";
            // Find the matching snippet
            let snippet = title;
            for (const sf of searchFields) {
              const v = record[sf];
              if (typeof v === "string" && v.toLowerCase().includes(q)) {
                const idx = v.toLowerCase().indexOf(q);
                const start = Math.max(0, idx - 30);
                snippet = (start > 0 ? "..." : "") + v.slice(start, start + 120) + (start + 120 < v.length ? "..." : "");
                break;
              }
            }
            return {
              entityType: key,
              entityId: String(record.id || ""),
              title: title.length > 100 ? title.slice(0, 100) + "..." : title,
              content: snippet,
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
