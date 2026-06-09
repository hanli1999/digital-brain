import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await prisma.inboxItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const item = await prisma.inboxItem.update({
    where: { id: params.id },
    data: {
      title: body.title,
      content: body.content,
      tags: body.tags,
      status: body.status,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.inboxItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
