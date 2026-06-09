import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const items = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || "",
      status: body.status || "todo",
      priority: body.priority || "normal",
      tags: body.tags || "[]",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "task", entityId: item.id } },
    create: { entityType: "task", entityId: item.id, title: item.title, content: item.description, tags: item.tags },
    update: { title: item.title, content: item.description, tags: item.tags },
  });
  return NextResponse.json(item, { status: 201 });
}
