import { listRecords } from "../lib/feishu.js";
import { toEnglish } from "../lib/field-map.js";

async function main() {
  const records = await listRecords("tbl2pG26LdF3c3cX");
  if (records.length === 0) { console.log("No records"); return; }
  const english = await toEnglish("tbl2pG26LdF3c3cX", records[0]);
  console.log("Record ID:", records[0].record_id);
  for (const [k, v] of Object.entries(english as any)) {
    const t = typeof v;
    const preview = t === "object" ? JSON.stringify(v).slice(0, 100) : String(v).slice(0, 100);
    console.log(`  ${k} (${t}): ${preview}`);
  }
}

main();
