import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "config", "models.json");

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeConfig(data: any) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// GET: 返回服务端模型配置（不暴露 key 明文，只返回是否配置）
export async function GET() {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ configured: false });
  }
  return NextResponse.json({
    configured: {
      openrouter: !!config.openrouter?.apiKey,
      minimax: !!config.minimax?.apiKey,
    },
    models: {
      visionModel: config.openrouter?.visionModel || "qwen/qwen2.5-vl-72b-instruct",
      copyModel: config.openrouter?.copyModel || "openai/gpt-4o",
      imageModel: config.minimax?.imageModel || "image-01",
    },
    updatedAt: config.updatedAt,
  });
}

// PUT: 更新服务端模型配置（管理员接口）
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = readConfig() || {};
    const updated = {
      ...existing,
      openrouter: {
        ...existing.openrouter,
        apiKey: body.openrouterKey?.trim() || existing.openrouter?.apiKey || "",
        enabled: body.openrouterEnabled ?? true,
        visionModel: body.visionModel || existing.openrouter?.visionModel || "qwen/qwen2.5-vl-72b-instruct",
        copyModel: body.copyModel || existing.openrouter?.copyModel || "openai/gpt-4o",
      },
      minimax: {
        ...existing.minimax,
        apiKey: body.minimaxKey?.trim() || existing.minimax?.apiKey || "",
        enabled: body.minimaxEnabled ?? true,
        imageModel: body.imageModel || existing.minimax?.imageModel || "image-01",
      },
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    };
    writeConfig(updated);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
