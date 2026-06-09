import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (body.header?.event_type === "im.message.receive_v1") {
    const event = body.event;
    const msgType = event?.message?.msg_type;
    const content = event?.message?.content || "";
    const imageUrls: string[] = [];

    let title = "";
    let textContent = content;

    if (msgType === "text") {
      try {
        const parsed = JSON.parse(content);
        textContent = parsed.text || "";
        title = textContent.slice(0, 50);
      } catch { /* keep raw content */ }
    } else if (msgType === "image") {
      title = "[图片消息]";
      textContent = `image_key: ${event?.message?.image_key || ""}`;
      imageUrls.push(event?.message?.image_key || "");
    }

    await prisma.inboxItem.create({
      data: {
        title: title || "[飞书消息]",
        content: textContent,
        source: "feishu-bot",
        imageUrls: JSON.stringify(imageUrls),
        status: "pending",
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
