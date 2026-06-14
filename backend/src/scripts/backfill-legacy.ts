// One-time script: create "legacy" user and assign all existing data to it.
// Run: npx tsx src/scripts/backfill-legacy.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONTENT_MODELS = [
  "inboxItem", "task", "tool", "method", "document",
  "aiMechanism", "resource", "fileAsset", "calendarEvent",
  "jiyuanlu", "metric", "searchIndex", "insight",
];

async function main() {
  console.log("Creating legacy user...");
  const legacy = await prisma.user.upsert({
    where: { id: "legacy" },
    update: {},
    create: { id: "legacy", username: "legacy", passwordHash: "legacy_import" },
  });
  console.log("Legacy user:", legacy.id);

  for (const modelName of CONTENT_MODELS) {
    const model = (prisma as any)[modelName];
    if (!model) { console.log(`Skip: ${modelName}`); continue; }
    const result = await model.updateMany({
      where: { userId: "legacy" },
      data: { userId: "legacy" },
    });
    if (result.count > 0) console.log(`  ${modelName}: ${result.count} rows`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
