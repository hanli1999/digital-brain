import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const items = await prisma.method.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.method.create({
    data: {
      title: body.title,
      content: body.content || "",
      tags: body.tags || "[]",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "method", entityId: item.id } },
    create: { entityType: "method", entityId: item.id, title: item.title, content: item.content, tags: item.tags },
    update: { title: item.title, content: item.content, tags: item.tags },
  });
  return NextResponse.json(item, { status: 201 });
}
