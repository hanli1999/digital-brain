import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, apiKey } = await req.json();
  const key = apiKey || process.env.DEEPSEEK_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "No API key configured" }, { status: 400 });
  }

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await resp.json();
  return NextResponse.json(data);
}
