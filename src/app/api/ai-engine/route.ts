import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.aiMechanism.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.aiMechanism.create({
    data: {
      name: body.name,
      type: body.type || "prompt",
      content: body.content || "",
      parameters: body.parameters || "{}",
    },
  });
  await prisma.searchIndex.upsert({
    where: { entityType_entityId: { entityType: "ai_mechanism", entityId: item.id } },
    create: { entityType: "ai_mechanism", entityId: item.id, title: item.name, content: item.content },
    update: { title: item.name, content: item.content },
  });
  return NextResponse.json(item, { status: 201 });
}
