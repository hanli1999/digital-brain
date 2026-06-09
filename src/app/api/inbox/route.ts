import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (source) where.source = source;

  const items = await prisma.inboxItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.inboxItem.create({
    data: {
      title: body.title || "",
      content: body.content || "",
      source: body.source || "manual",
      imageUrls: body.imageUrls || "[]",
      tags: body.tags || "[]",
    },
  });

  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "inbox", entityId: item.id } },
    create: {
      entityType: "inbox",
      entityId: item.id,
      title: item.title,
      content: item.content,
      tags: item.tags,
    },
    update: {
      title: item.title,
      content: item.content,
      tags: item.tags,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
