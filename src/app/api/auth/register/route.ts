import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码必填" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    // Check existing
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name: name || email.split("@")[0],
      email,
      passwordHash,
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    if (err.message === "USER_EXISTS") {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "注册失败" }, { status: 500 });
  }
}
