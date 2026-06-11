import { Hono } from "hono";
import { listRecords } from "../lib/feishu.js";
import { toEnglish } from "../lib/field-map.js";

// Tables to search across (skip calendar - synced from ticktick)
const SEARCH_TABLES: { key: string; tableId: string; titleFields: string[]; contentFields: string[] }[] = [
  { key: "inbox", tableId: "tbl2pG26LdF3c3cX", titleFields: ["title"], contentFields: ["content", "aiSummary", "ocrText"] },
  { key: "tasks", tableId: "tblOyyByZYtZz7dA", titleFields: ["detail"], contentFields: ["detail", "action"] },
  { key: "tools", tableId: "tbl5r4qZHGnFxUSC", titleFields: ["name"], contentFields: ["name", "corePower", "initScript", "record"] },
  { key: "methods", tableId: "tbllqXDX0MbmUl07", titleFields: ["title"], contentFields: ["title", "essence"] },
  { key: "library", tableId: "tblfsL2sxubcpw0i", titleFields: ["title"], contentFields: ["title", "abstract", "snippet", "keywords"] },
  { key: "ai-engine", tableId: "tblBgV1gLsh22qbV", titleFields: ["name"], contentFields: ["name", "coreIdea", "features", "examples", "scenarios", "rawContent"] },
  { key: "resources", tableId: "tbl6WHGWD9DKLuJ5", titleFields: ["name"], contentFields: ["name", "detail"] },
  { key: "files", tableId: "tblMWDRaRN2sY2kb", titleFields: ["text"], contentFields: ["text"] },
];

const app = new Hono();

app.get("/", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  if (!q) return c.json([]);

  const allResults: { entityType: string; entityId: string; title: string; content: string }[] = [];

  const tableResults = await Promise.all(
    SEARCH_TABLES.map(async ({ key, tableId, titleFields, contentFields }) => {
      try {
        const records = await listRecords(tableId, { page_size: "100" });
        const mapped = await Promise.all(records.map((r) => toEnglish(tableId, r)));
        const results: { entityType: string; entityId: string; title: string; content: string }[] = [];

        for (const record of mapped) {
          const id = String(record.id || "");
          // Find title from title fields
          let title = "";
          for (const tf of titleFields) {
            const v = record[tf];
            if (typeof v === "string" && v.trim()) { title = v.trim(); break; }
          }
          if (!title) title = "(无标题)";

          // Check if any field matches the query
          let matched = title.toLowerCase().includes(q);
          let matchContent = "";

          for (const cf of contentFields) {
            const v = record[cf];
            if (typeof v === "string" && v.toLowerCase().includes(q)) {
              matched = true;
              matchContent = v;
              break;
            }
          }

          if (matched) {
            results.push({
              entityType: key,
              entityId: id,
              title: title.length > 100 ? title.slice(0, 100) + "..." : title,
              content: matchContent ? (matchContent.length > 200 ? matchContent.slice(0, 200) + "..." : matchContent) : title,
            });
          }
        }

        return results;
      } catch {
        return [];
      }
    })
  );

  for (const results of tableResults) {
    allResults.push(...results);
  }

  return c.json(allResults.slice(0, 20));
});

export default app;
