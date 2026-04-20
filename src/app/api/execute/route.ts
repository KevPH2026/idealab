import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// --- Config ---
const CONFIG_FILE = path.join(process.cwd(), "config", "models.json");

interface Skill {
  id: string;
  name: string;
  description: string;
  models: ("vision" | "copy" | "image")[];
  enabled: boolean;
  freeQuotaUser: number;
  pipeline?: string[];
}

interface Pricing {
  perTurnPrice: number;
  freeUserTurns: number;
  modelPriceMultiplier: Record<string, number>;
  imageGenerationPrice: number;
  minCharge: number;
  maxSessionCharge: number;
}

function getDefaultConfig() {
  return {
    skills: [
      { id: "visual_analysis", name: "视觉分析", description: "上传图片，AI 分析画面内容与适用场景", models: ["vision"], enabled: true, freeQuotaUser: 5 },
      { id: "copy_generation", name: "文案生成", description: "基于图片生成配套营销文案", models: ["copy"], enabled: true, freeQuotaUser: 5 },
      { id: "image_generation", name: "图片生成", description: "根据文案生成配套图片", models: ["image"], enabled: true, freeQuotaUser: 2 },
      { id: "full_pipeline", name: "完整工作流", description: "图片→分析→文案→配套图片，一站式生成", models: ["vision", "copy", "image"], enabled: true, freeQuotaUser: 3 },
    ] as Skill[],
    pricing: {
      perTurnPrice: 0.5,
      freeUserTurns: 5,
      modelPriceMultiplier: { "qwen/qwen2.5-vl-72b-instruct": 1.0, "openai/gpt-4o": 1.5, "claude-sonnet-4": 1.2, "image-01": 1.0 },
      imageGenerationPrice: 1.0,
      minCharge: 0.5,
      maxSessionCharge: 50,
    } as Pricing,
    openrouter: { apiKey: process.env.OPENROUTER_API_KEY || "", visionModel: "qwen/qwen2.5-vl-72b-instruct", copyModel: "openai/gpt-4o" },
    minimax: { apiKey: process.env.MINIMAX_API_KEY || "", imageModel: "image-01" },
  };
}

function resolveConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const file = JSON.parse(raw);
    const defaults = getDefaultConfig();
    return {
      skills: file.skills || defaults.skills,
      pricing: { ...defaults.pricing, ...(file.pricing || {}) },
      openrouter: { ...defaults.openrouter, ...(file.openrouter || {}) },
      minimax: { ...defaults.minimax, ...(file.minimax || {}) },
    };
  } catch {
    return getDefaultConfig();
  }
}

// --- Key resolution ---
async function resolveKey(userId: string, provider: "openrouter" | "minimax", cfg: ReturnType<typeof resolveConfig>) {
  try {
    const userKey = await prisma.apiKey.findUnique({ where: { userId_provider: { userId, provider } } });
    if (userKey?.enabled && userKey.key) return { key: userKey.key, source: "user" as const };
  } catch {}
  const serverKey = provider === "openrouter" ? cfg.openrouter.apiKey : cfg.minimax.apiKey;
  if (serverKey) return { key: serverKey, source: "server" as const };
  return { key: "", source: "none" as const };
}

// --- Cost calculation ---
function calcTurnCost(skill: Skill, modelIds: string[], pricing: Pricing, hasImages: boolean): number {
  let cost = pricing.perTurnPrice;
  for (const m of modelIds) {
    cost *= (pricing.modelPriceMultiplier[m] || 1.0);
  }
  if (hasImages) cost += pricing.imageGenerationPrice;
  return Math.min(Math.max(cost, pricing.minCharge), pricing.maxSessionCharge);
}

// --- Execute ---
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const { skillId, sessionId: existingSessionId, message, imageUrl, regenerate } = await req.json();

    const cfg = resolveConfig();
    const skill = cfg.skills.find((s: Skill) => s.id === skillId);
    if (!skill || !skill.enabled) {
      return NextResponse.json({ error: "Skill 不存在或已禁用" }, { status: 404 });
    }

    // Get or create session
    let userSession;
    if (existingSessionId && !regenerate) {
      userSession = await prisma.userSession.findUnique({ where: { id: existingSessionId } });
      if (!userSession || userSession.userId !== userId) {
        return NextResponse.json({ error: "会话不存在" }, { status: 404 });
      }
    } else {
      userSession = await prisma.userSession.create({ data: { userId, skillId, status: "active" } });
    }

    // Quota check
    const quota = await prisma.userQuota.findUnique({ where: { userId } });
    const usedFree = quota?.freeUsed || 0;
    const totalFree = skill.freeQuotaUser || cfg.pricing.freeUserTurns;
    const isFreeTurn = usedFree < totalFree;

    // Resolve keys
    const [visionKey, copyKey, imageKey] = await Promise.all([
      resolveKey(userId, "openrouter", cfg),
      resolveKey(userId, "openrouter", cfg),
      resolveKey(userId, "minimax", cfg),
    ]);

    if (!visionKey.key && skill.models.includes("vision")) {
      return NextResponse.json({ error: "无可用 OpenRouter Key，请先配置" }, { status: 400 });
    }
    if (!copyKey.key && skill.models.includes("copy")) {
      return NextResponse.json({ error: "无可用 OpenRouter Key，请先配置" }, { status: 400 });
    }
    if (!imageKey.key && skill.models.includes("image")) {
      return NextResponse.json({ error: "无可用 MiniMax Key，请先配置" }, { status: 400 });
    }

    const keySource = visionKey.source === "user" ? "user" : "server";
    const headers = (key: string) => ({
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://idealab.now",
      "X-Title": "IdeaLab",
    });

    // Execute
    let visionResult = "";
    let copyResult = "";
    let imageUrls: string[] = [];
    let tokensUsed = 0;

    if (skill.models.includes("vision") && imageUrl) {
      const vr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers(visionKey.key),
        body: JSON.stringify({
          model: cfg.openrouter.visionModel,
          messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: "分析这张图片：识别主体、场景、风格、构图、色彩、适用行业/平台，给出结构化分析。" }] }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });
      if (!vr.ok) return NextResponse.json({ error: `视觉分析失败: ${await vr.text()}` }, { status: 500 });
      const vd = await vr.json();
      visionResult = vd.choices?.[0]?.message?.content || "";
      tokensUsed += vd.usage?.total_tokens || 0;
    }

    if (skill.models.includes("copy")) {
      const cr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers(copyKey.key),
        body: JSON.stringify({
          model: cfg.openrouter.copyModel,
          messages: [{ role: "user", content: `你是营销文案专家。用户反馈："${message || '无'}"\n视觉参考：${visionResult || '无'}\n要求：接地气、有感染力、能引发共鸣，可有反转。直接输出3个不同角度文案，用---分隔。` }],
          max_tokens: 1024,
          temperature: 0.8,
        }),
      });
      if (!cr.ok) return NextResponse.json({ error: `文案生成失败: ${await cr.text()}` }, { status: 500 });
      const cd = await cr.json();
      copyResult = cd.choices?.[0]?.message?.content || "";
      tokensUsed += cd.usage?.total_tokens || 0;
    }

    if (skill.models.includes("image") && (regenerate || skill.models.length === 1)) {
      const ir = await fetch("https://api.minimax.chat/v1/image_generation", {
        method: "POST",
        headers: { "Authorization": `Bearer ${imageKey.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "image-01", prompt: message || copyResult || "创意营销图片", aspect_ratio: "1:1", response_format: "url" }),
      });
      if (ir.ok) {
        const id = await ir.json();
        const taskId = id.data?.task_id;
        if (taskId) {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`https://api.minimax.chat/v1/image_generation/retrieve?task_id=${taskId}`, { headers: { "Authorization": `Bearer ${imageKey.key}` } });
            const pd = await poll.json();
            if (pd.data?.image_urls?.length > 0) { imageUrls = pd.data.image_urls; break; }
          }
        }
      }
    }

    const modelIds = (skill.models as string[]).map(m => m === "vision" ? cfg.openrouter.visionModel : m === "copy" ? cfg.openrouter.copyModel : cfg.minimax.imageModel);
    const cost = isFreeTurn ? 0 : calcTurnCost(skill, modelIds, cfg.pricing, imageUrls.length > 0);

    const turnCount = await prisma.turn.count({ where: { sessionId: userSession.id } });
    const turnNumber = turnCount + 1;

    const turn = await prisma.turn.create({
      data: {
        userId, sessionId: userSession.id, turnNumber,
        userMessage: message || null,
        aiResponse: JSON.stringify({ vision: visionResult, copy: copyResult, images: imageUrls }),
        skillId, modelUsed: modelIds.join("+"), keySource, tokensUsed, cost,
        imageUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      },
    });

    await prisma.userSession.update({ where: { id: userSession.id }, data: { totalTurns: { increment: 1 }, totalCharge: { increment: cost } } });

    if (isFreeTurn) {
      await prisma.userQuota.upsert({ where: { userId }, create: { userId, freeUsed: 1, freeTotal: cfg.pricing.freeUserTurns }, update: { freeUsed: { increment: 1 } } });
    }

    await prisma.usageLog.create({ data: { userId, turnId: turn.id, skillId, action: "turn_executed", cost } });

    return NextResponse.json({
      sessionId: userSession.id, turnId: turn.id, turnNumber,
      result: { vision: visionResult, copy: copyResult, images: imageUrls },
      cost, isFreeTurn,
      quotaRemaining: isFreeTurn ? Math.max(0, totalFree - usedFree - 1) : null,
      keySource,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "执行失败" }, { status: 500 });
  }
}

// GET: list skills + pricing
export async function GET() {
  const cfg = resolveConfig();
  return NextResponse.json({ skills: cfg.skills, pricing: cfg.pricing });
}
