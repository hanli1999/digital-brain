import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const all = await prisma.settings.findMany();
  const map: Record<string, string> = {};
  for (const { key, value } of all) {
    map[key] = value;
  }
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    await prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  return NextResponse.json({ ok: true });
}
