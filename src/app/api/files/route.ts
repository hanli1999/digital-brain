import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.fileAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.fileAsset.create({
    data: {
      filename: body.filename,
      url: body.url || "",
      mimeType: body.mimeType || "application/octet-stream",
      size: body.size || 0,
      tags: body.tags || "[]",
    },
  });
  return NextResponse.json(item, { status: 201 });
}
