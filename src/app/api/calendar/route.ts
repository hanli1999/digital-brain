import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.calendarEvent.findMany({
    orderBy: { startTime: "asc" },
    take: 200,
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description || "",
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : new Date(body.startTime),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
