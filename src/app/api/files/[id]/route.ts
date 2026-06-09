import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.fileAsset.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const item = await prisma.fileAsset.update({
    where: { id: params.id },
    data: { filename: body.filename, url: body.url, tags: body.tags },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.fileAsset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
