import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, brandUrl, phone } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码必填" }, { status: 400 });
    }

    // 简单邮箱格式校验
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: "姓名必填" }, { status: 400 });
    }

    // Check existing
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      brandUrl: brandUrl?.trim() || undefined,
      phone: phone?.trim() || undefined,
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    if (err.message === "USER_EXISTS") {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: err.message || "注册失败" }, { status: 500 });
  }
}
