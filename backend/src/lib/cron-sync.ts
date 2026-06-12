import { isFeishuConfigured, pullTable, tables } from "./feishu-sync.js";

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

export function startSyncCron(intervalMin: number = 5) {
  if (!isFeishuConfigured()) {
    console.log("[cron] Feishu not configured — sync cron disabled");
    return;
  }

  const ms = intervalMin * 60 * 1000;
  console.log(`[cron] Feishu sync every ${intervalMin}min`);

  // Run immediately on start, then on interval
  doSync();
  syncTimer = setInterval(doSync, ms);
}

export function stopSyncCron() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

async function doSync() {
  if (isSyncing) return;
  isSyncing = true;

  let total = 0;
  let errors = 0;

  for (const key of Object.keys(tables)) {
    try {
      const result = await pullTable(key);
      total += result.imported;
      errors += result.errors;
    } catch (e) {
      errors++;
      console.error(`[cron] ${key} pull failed:`, (e as Error).message?.slice(0, 80));
    }
  }

  if (total > 0 || errors > 0) {
    console.log(`[cron] sync done: ${total} imported, ${errors} errors`);
  }

  isSyncing = false;
}
