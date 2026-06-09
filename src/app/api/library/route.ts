import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const items = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.document.create({
    data: {
      title: body.title,
      abstract: body.abstract || "",
      author: body.author || "",
      tags: body.tags || "[]",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "document", entityId: item.id } },
    create: { entityType: "document", entityId: item.id, title: item.title, content: item.abstract, tags: item.tags },
    update: { title: item.title, content: item.abstract, tags: item.tags },
  });
  return NextResponse.json(item, { status: 201 });
}
