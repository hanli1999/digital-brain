import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json([]);

  const results = await prisma.searchIndex.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { content: { contains: q } },
      ],
    },
    take: 20,
  });

  return NextResponse.json(results);
}
