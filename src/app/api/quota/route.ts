import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const quota = await prisma.userQuota.findUnique({ where: { userId: session.user.id } });
    if (!quota) {
      return NextResponse.json({ freeUsed: 0, freeTotal: 5 });
    }
    return NextResponse.json({ freeUsed: quota.freeUsed, freeTotal: quota.freeTotal });
  } catch {
    return NextResponse.json({ freeUsed: 0, freeTotal: 5 });
  }
}
