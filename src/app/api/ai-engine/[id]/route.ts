import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.aiMechanism.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const item = await prisma.aiMechanism.update({
    where: { id: params.id },
    data: { name: body.name, type: body.type, content: body.content, parameters: body.parameters },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.aiMechanism.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
