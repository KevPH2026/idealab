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

// GET: 返回服务端模型配置（不暴露 key 明文）
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
      visionTemp: config.openrouter?.visionTemp ?? 0.7,
      copyTemp: config.openrouter?.copyTemp ?? 0.8,
      visionMaxTokens: config.openrouter?.visionMaxTokens ?? 2048,
      copyMaxTokens: config.openrouter?.copyMaxTokens ?? 1024,
    },
    image: {
      aspectRatio: config.image?.aspectRatio || "1:1",
      quality: config.image?.quality || "medium",
      style: config.image?.style || "auto",
    },
    prompts: {
      visionTemplate: config.prompts?.visionTemplate || "",
      copyTemplate: config.prompts?.copyTemplate || "",
    },
    output: {
      language: config.output?.language || "zh",
      variations: config.output?.variations || 1,
    },
    features: {
      enableLogoWatermark: config.features?.enableLogoWatermark ?? false,
      enableAutoRetry: config.features?.enableAutoRetry ?? true,
      enableMultiFormat: config.features?.enableMultiFormat ?? false,
    },
    branding: {
      brandName: config.branding?.brandName || "IdeaLab",
      brandTagline: config.branding?.brandTagline || "AI灵感创作平台",
    },
    updatedAt: config.updatedAt,
  });
}

// 简单的共享密钥校验
function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

// PUT: 更新服务端模型配置（管理员接口）
export async function PUT(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
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
        visionTemp: body.visionTemp ?? existing.openrouter?.visionTemp ?? 0.7,
        copyTemp: body.copyTemp ?? existing.openrouter?.copyTemp ?? 0.8,
        visionMaxTokens: body.visionMaxTokens ?? existing.openrouter?.visionMaxTokens ?? 2048,
        copyMaxTokens: body.copyMaxTokens ?? existing.openrouter?.copyMaxTokens ?? 1024,
      },
      minimax: {
        ...existing.minimax,
        apiKey: body.minimaxKey?.trim() || existing.minimax?.apiKey || "",
        enabled: body.minimaxEnabled ?? true,
        imageModel: body.imageModel || existing.minimax?.imageModel || "image-01",
      },
      image: {
        aspectRatio: body.imageAspectRatio || existing.image?.aspectRatio || "1:1",
        quality: body.imageQuality || existing.image?.quality || "medium",
        style: body.imageStyle || existing.image?.style || "auto",
      },
      prompts: {
        visionTemplate: body.visionPromptTemplate || existing.prompts?.visionTemplate || "",
        copyTemplate: body.copyPromptTemplate || existing.prompts?.copyTemplate || "",
      },
      output: {
        language: body.outputLanguage || existing.output?.language || "zh",
        variations: body.outputVariations ?? existing.output?.variations ?? 1,
      },
      features: {
        enableLogoWatermark: body.enableLogoWatermark ?? existing.features?.enableLogoWatermark ?? false,
        enableAutoRetry: body.enableAutoRetry ?? existing.features?.enableAutoRetry ?? true,
        enableMultiFormat: body.enableMultiFormat ?? existing.features?.enableMultiFormat ?? false,
      },
      branding: {
        brandName: body.brandName || existing.branding?.brandName || "IdeaLab",
        brandTagline: body.brandTagline || existing.branding?.brandTagline || "AI灵感创作平台",
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
