import { Hono } from "hono";
import { listRecords } from "../lib/db.js";

const SEARCH_TABLES: { key: string; dbTable: string; titleField: string; searchFields: string[] }[] = [
  { key: "inbox", dbTable: "inbox", titleField: "title", searchFields: ["title", "content", "aiSummary"] },
  { key: "tasks", dbTable: "tasks", titleField: "title", searchFields: ["title", "description", "action"] },
  { key: "tools", dbTable: "tools", titleField: "name", searchFields: ["name", "corePower", "initScript", "record"] },
  { key: "methods", dbTable: "methods", titleField: "title", searchFields: ["title", "essence"] },
  { key: "library", dbTable: "library", titleField: "title", searchFields: ["title", "abstract", "snippet", "keywords"] },
  { key: "ai-engine", dbTable: "ai-engine", titleField: "name", searchFields: ["name", "coreIdea", "features", "examples", "scenarios"] },
  { key: "resources", dbTable: "resources", titleField: "name", searchFields: ["name", "detail"] },
  { key: "files", dbTable: "files", titleField: "text", searchFields: ["text"] },
  { key: "calendar", dbTable: "calendar", titleField: "title", searchFields: ["title", "content", "description"] },
  { key: "jiyuanlu", dbTable: "jiyuanlu", titleField: "detail", searchFields: ["detail", "description", "action"] },
];

const app = new Hono();

app.get("/", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  if (!q) return c.json([]);

  const tableResults = await Promise.all(
    SEARCH_TABLES.map(async ({ key, dbTable, titleField, searchFields }) => {
      try {
        const records = await listRecords(dbTable);

        return records
          .filter((record: Record<string, unknown>) => {
            for (const sf of searchFields) {
              const v = record[sf];
              if (typeof v === "string" && v.toLowerCase().includes(q)) return true;
            }
            return false;
          })
          .map((record: Record<string, unknown>) => {
            const title = String(record[titleField] || "").trim() || "(无标题)";
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
