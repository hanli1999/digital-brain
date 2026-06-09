import { NextResponse } from "next/server";
import { feishuRequest } from "@/lib/feishu";

export async function POST() {
  if (!process.env.FEISHU_APP_ID) {
    return NextResponse.json({ error: "Feishu not configured" }, { status: 400 });
  }

  const result = await feishuRequest("GET", "/bitable/v1/app");
  return NextResponse.json({ status: "sync_triggered", feishu: result });
}
