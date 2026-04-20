import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const keys = await prisma.apiKey.findMany({ where: { userId: session.user.id } });
    const result: Record<string, { enabled: boolean; label?: string }> = {};
    for (const k of keys) {
      result[k.provider] = { enabled: k.enabled, label: k.label || undefined };
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { openrouter, minimax } = await req.json();

    const userId = session.user.id!;
    const upsert = async (provider: string, key: string) => {
      if (!key) return;
      await prisma.apiKey.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, key, enabled: true },
        update: { key, enabled: true },
      });
    };

    if (openrouter) await upsert("openrouter", openrouter);
    if (minimax) await upsert("minimax", minimax);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
