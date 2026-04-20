import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { deductQuota, getUserQuotas } from "@/lib/notion";

// --- Config ---
const CONFIG_FILE = path.join(process.cwd(), "config", "models.json");

interface Skill {
  id: string;
  name: string;
  description: string;
  models: ("vision" | "copy" | "image")[];
  enabled: boolean;
  freeQuotaUser: number;
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

// In-memory session store (per-deployment, resets on cold start)
const sessions = new Map<string, { userId: string; skillId: string; turns: number; charge: number }>();

function calcTurnCost(skill: Skill, modelIds: string[], pricing: Pricing, hasImages: boolean): number {
  let cost = pricing.perTurnPrice;
  for (const m of modelIds) {
    cost *= (pricing.modelPriceMultiplier[m] || 1.0);
  }
  if (hasImages) cost += pricing.imageGenerationPrice;
  return Math.min(Math.max(cost, pricing.minCharge), pricing.maxSessionCharge);
}

// GET: list skills + pricing
export async function GET() {
  const cfg = resolveConfig();
  return NextResponse.json({ skills: cfg.skills, pricing: cfg.pricing });
}

// POST: execute a turn
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    const { skillId, sessionId: existingSessionId, message, imageUrl, regenerate } = await req.json();

    const cfg = resolveConfig();
    const skill = cfg.skills.find((s: Skill) => s.id === skillId);
    if (!skill || !skill.enabled) {
      return NextResponse.json({ error: "Skill 不存在或已禁用" }, { status: 404 });
    }

    // Get or create session
    let sessId = existingSessionId;
    let sess;
    if (sessId && sessions.has(sessId)) {
      sess = sessions.get(sessId)!;
      if (sess.userId !== userId) return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    } else {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessions.set(sessId, { userId, skillId, turns: 0, charge: 0 });
      sess = sessions.get(sessId)!;
    }

    // Quota check
    const quota = await getUserQuotas(email);
    const totalFree = skill.freeQuotaUser || cfg.pricing.freeUserTurns;
    const usedFree = quota?.turnsUsed || 0;
    const quotasRemaining = quota?.quotasRemaining ?? totalFree;
    const isFreeTurn = usedFree < totalFree;

    // Determine keys to use
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

    if (skill.models.includes("vision") && imageUrl) {
      const key = cfg.openrouter.apiKey;
      if (!key) return NextResponse.json({ error: "系统未配置 OpenRouter Key" }, { status: 500 });
      const vr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers(key),
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
    }

    if (skill.models.includes("copy")) {
      const key = cfg.openrouter.apiKey;
      if (!key) return NextResponse.json({ error: "系统未配置 OpenRouter Key" }, { status: 500 });
      const cr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers(key),
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
    }

    if (skill.models.includes("image") && (regenerate || skill.models.length === 1)) {
      const key = cfg.minimax.apiKey;
      if (!key) return NextResponse.json({ error: "系统未配置 MiniMax Key" }, { status: 500 });
      const ir = await fetch("https://api.minimax.chat/v1/image_generation", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "image-01", prompt: message || copyResult || "创意营销图片", aspect_ratio: "1:1", response_format: "url" }),
      });
      if (ir.ok) {
        const id = await ir.json();
        const taskId = id.data?.task_id;
        if (taskId) {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`https://api.minimax.chat/v1/image_generation/retrieve?task_id=${taskId}`, { headers: { "Authorization": `Bearer ${key}` } });
            const pd = await poll.json();
            if (pd.data?.image_urls?.length > 0) { imageUrls = pd.data.image_urls; break; }
          }
        }
      }
    }

    const modelIds = (skill.models as string[]).map(m => m === "vision" ? cfg.openrouter.visionModel : m === "copy" ? cfg.openrouter.copyModel : cfg.minimax.imageModel);
    const cost = isFreeTurn ? 0 : calcTurnCost(skill, modelIds, cfg.pricing, imageUrls.length > 0);

    // Update in-memory session
    sess.turns += 1;
    sess.charge += cost;

    // Deduct quota in Notion
    if (isFreeTurn) {
      await deductQuota(email);
    }

    return NextResponse.json({
      sessionId: sessId,
      turnNumber: sess.turns,
      result: { vision: visionResult, copy: copyResult, images: imageUrls },
      cost,
      isFreeTurn,
      quotasRemaining: isFreeTurn ? Math.max(0, quotasRemaining - 1) : quotasRemaining,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "执行失败" }, { status: 500 });
  }
}
