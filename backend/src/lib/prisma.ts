import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

// Models that should NOT be user-scoped
const TENANT_MODELS = new Set([
  "InboxItem", "Task", "Tool", "Method", "Document",
  "AiMechanism", "Resource", "FileAsset", "CalendarEvent",
  "Jiyuanlu", "Metric", "SearchIndex", "Insight",
]);

const basePrisma = new PrismaClient();

export const tenantCtx = new AsyncLocalStorage<{ userId: string }>();

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        const ctx = tenantCtx.getStore();
        if (!ctx?.userId) return query(args);

        if (!TENANT_MODELS.has(model ?? "")) return query(args);

        // Auto-stamp userId on create
        if (["create", "createMany"].includes(operation)) {
          const data = (args as Record<string, any>).data;
          if (data) {
            if (Array.isArray(data)) {
              (args as any).data = data.map((r: any) => ({ ...r, userId: ctx.userId }));
            } else {
              (args as any).data = { ...data, userId: ctx.userId };
            }
          }
        }

        // Auto-filter by userId on reads/updates/deletes
        if (["findMany", "findUnique", "findFirst", "update", "updateMany",
             "delete", "deleteMany", "count", "aggregate", "groupBy", "upsert"].includes(operation)) {
          const where = (args as any).where;
          if (where !== undefined && typeof where === "object") {
            (args as any).where = { ...where, userId: ctx.userId };
          } else if (where === undefined && operation !== "upsert") {
            (args as any).where = { userId: ctx.userId };
          }
        }

        return query(args);
      },
    },
  },
});
