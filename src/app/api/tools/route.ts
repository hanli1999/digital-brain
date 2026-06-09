import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const where: Record<string, unknown> = {};
  if (category) where.category = category;

  const items = await prisma.tool.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.tool.create({
    data: {
      name: body.name,
      description: body.description || "",
      category: body.category || "other",
      url: body.url || "",
      tags: body.tags || "[]",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "tool", entityId: item.id } },
    create: { entityType: "tool", entityId: item.id, title: item.name, content: item.description, tags: item.tags },
    update: { title: item.name, content: item.description, tags: item.tags },
  });
  return NextResponse.json(item, { status: 201 });
}
