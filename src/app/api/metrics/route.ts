import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.metric.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.metric.create({
    data: {
      name: body.name,
      value: body.value || 0,
      unit: body.unit || "",
      category: body.category || "",
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
