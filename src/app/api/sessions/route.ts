import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/sessions - list user's sessions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const sessions = await prisma.userSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}

// POST /api/sessions/done - end a session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { sessionId } = await req.json();
    await prisma.userSession.updateMany({
      where: { id: sessionId, userId: session.user.id },
      data: { status: "completed", endedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
