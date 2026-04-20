import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Sessions are stored in-memory on the server
// They reset on cold start — this is intentional for simplicity
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    // Return empty list — in-memory sessions are not exposed via API
    return NextResponse.json({ sessions: [] });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}
