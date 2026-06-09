import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const target = body.routeTarget as string;
  const inboxItem = await prisma.inboxItem.findUnique({ where: { id: params.id } });
  if (!inboxItem) return NextResponse.json({ error: "Inbox item not found" }, { status: 404 });

  let routedId = "";

  switch (target) {
    case "task": {
      const task = await prisma.task.create({
        data: { title: inboxItem.title, description: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = task.id;
      break;
    }
    case "tool": {
      const tool = await prisma.tool.create({
        data: { name: inboxItem.title, description: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = tool.id;
      break;
    }
    case "method": {
      const method = await prisma.method.create({
        data: { title: inboxItem.title, content: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = method.id;
      break;
    }
    case "library": {
      const doc = await prisma.document.create({
        data: { title: inboxItem.title, abstract: inboxItem.content, tags: inboxItem.tags },
      });
      routedId = doc.id;
      break;
    }
    case "calendar": {
      const event = await prisma.calendarEvent.create({
        data: { title: inboxItem.title, description: inboxItem.content, startTime: new Date() },
      });
      routedId = event.id;
      break;
    }
    case "ai-engine": {
      const mech = await prisma.aiMechanism.create({
        data: { name: inboxItem.title, content: inboxItem.content },
      });
      routedId = mech.id;
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown target: ${target}` }, { status: 400 });
  }

  const updated = await prisma.inboxItem.update({
    where: { id: params.id },
    data: { status: "routed", routeTarget: target, routedTo: routedId },
  });

  await prisma.auditLog.create({
    data: {
      action: "route",
      entity: "inbox",
      entityId: params.id,
      detail: JSON.stringify({ from: "inbox", to: target, routedId }),
    },
  });

  return NextResponse.json({ inbox: updated, routedId, target });
}
