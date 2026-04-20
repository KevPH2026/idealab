import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "config", "models.json");

function readServerConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      materials,
      scene,
      styleTags,
      audiences,
      goal,
      userOpenRouterKey,
      userMiniMaxKey,
      visionModel,
      copyModel,
      imageModel,
    } = body;

    // ── Resolve effective keys ───────────────────────────────────────
    const serverConfig = readServerConfig();

    const effectiveOpenRouterKey =
      userOpenRouterKey?.trim() || serverConfig?.openrouter?.apiKey || "";
    const effectiveMiniMaxKey =
      userMiniMaxKey?.trim() || serverConfig?.minimax?.apiKey || "";

    // ── Validate ─────────────────────────────────────────────────────
    if (!effectiveOpenRouterKey) {
      return NextResponse.json(
        {
          error:
            "未配置 OpenRouter API Key。请在设置中填入，或联系管理员开启服务端预设。",
          needKey: "openrouter",
        },
        { status: 400 }
      );
    }

    if (!effectiveMiniMaxKey) {
      return NextResponse.json(
        {
          error:
            "未配置 MiniMax API Key。请在设置中填入，或联系管理员开启服务端预设。",
          needKey: "minimax",
        },
        { status: 400 }
      );
    }

    // ── Effective models ─────────────────────────────────────────────
    const effectiveVisionModel =
      visionModel ||
      serverConfig?.openrouter?.visionModel ||
      "qwen/qwen2.5-vl-72b-instruct";
    const effectiveCopyModel =
      copyModel ||
      serverConfig?.openrouter?.copyModel ||
      "openai/gpt-4o";
    const effectiveImageModel =
      imageModel ||
      serverConfig?.minimax?.imageModel ||
      "image-01";

    // ── Parse materials ───────────────────────────────────────────────
    let materialSummary = "";
    for (const mat of materials || []) {
      if (mat.type === "file" && mat.preview) {
        try {
          const { qwenVision } = await import("@/lib/qwen");
          const desc = await qwenVision(
            mat.preview,
            `提取这张图片中的所有文字和产品信息，保持关键数据原文。风格：简洁专业。`,
            effectiveOpenRouterKey,
            effectiveVisionModel
          );
          materialSummary += `\n[图片] ${mat.name}: ${desc}`;
        } catch (err) {
          console.error("Vision parse error:", err);
          materialSummary += `\n[文件] ${mat.name}`;
        }
      } else if (mat.type === "link") {
        materialSummary += `\n[链接] ${mat.content}`;
      } else {
        materialSummary += `\n[文字] ${mat.content}`;
      }
    }

    // ── Build copy prompt ─────────────────────────────────────────────
    const audienceLabel = audiences?.join(", ") || "普通用户";
    const goalLabel = goal || "推广品牌";
    const sceneLabel = scene?.label || scene || "营销推广";
    const sceneWidth = scene?.width || 1080;
    const sceneHeight = scene?.height || 1080;

    const copyPrompt = `你是顶级营销文案专家。根据以下素材信息，为"${audienceLabel}"生成3条营销文案。

素材信息：${materialSummary || "无素材"}
使用场景：${sceneLabel}
目标受众：${audienceLabel}
推广目的：${goalLabel}
风格标签：${styleTags?.join(", ") || "现代简约"}

要求：
- 生成3条不同角度的文案
- 每条包含：主标题（10字内）、副标题（20字内）、正文（30-80字）、行动号召
- 文案要有冲击力，符合新媒体传播特点
- 行动号召要具体有力
- 直接返回JSON数组格式，不要其他内容

格式：
[
  {
    "headline": "主标题",
    "subheadline": "副标题",
    "body": "正文内容",
    "cta": "行动号召"
  }
]`;

    // ── Generate copy ────────────────────────────────────────────────
    const copyRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveOpenRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://idealab.now",
          "X-Title": "IdeaLab",
        },
        body: JSON.stringify({
          model: effectiveCopyModel,
          messages: [{ role: "user", content: copyPrompt }],
          max_tokens: 2000,
        }),
      }
    );

    if (!copyRes.ok) {
      const errText = await copyRes.text();
      console.error("OpenRouter error:", errText);
      return NextResponse.json(
        { error: "文案生成失败，请检查 API Key 额度" },
        { status: 502 }
      );
    }

    const copyData = await copyRes.json();
    let copyOptions = [];
    try {
      const raw = copyData.choices?.[0]?.message?.content || "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      copyOptions = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    } catch {
      copyOptions = [];
    }

    if (copyOptions.length === 0) {
      copyOptions = [
        {
          headline: "灵感触手可及",
          subheadline: "AI 帮你把想法变成现实",
          body: "输入素材，选择场景，AI 自动生成高质量营销文案和配套设计稿。",
          cta: "立即开始创作",
        },
      ];
    }

    // ── Generate images ──────────────────────────────────────────────
    const designs = [];
    const selectedCopy = copyOptions[0] || {};

    for (let i = 0; i < 3; i++) {
      try {
        const designPrompt = `Professional marketing poster design for ${sceneLabel}.
Size: ${sceneWidth}x${sceneHeight}px (${scene?.ratio || "1:1"}).
Style: ${styleTags?.join(", ") || "modern, tech, premium"}.
Main headline: ${selectedCopy.headline || "IdeaLab"}
Subtext: ${selectedCopy.subheadline || "AI 驱动的创意内容平台"}
Body text: ${selectedCopy.body || "用 AI 释放创意生产力"}
Call to action: ${selectedCopy.cta || "开始免费使用"}
Target audience: ${audienceLabel}

Color palette: Deep purple (#6B21A8) to indigo (#4F46E5) gradient, with electric blue (#38BDF8) accents.
Design style: Modern, sleek, premium AI SaaS aesthetic. Glassmorphism elements. Neon glow effects.
Make it visually striking and professional marketing material.`;

        const imgRes = await fetch(
          "https://api.minimax.chat/v1/image_generation",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${effectiveMiniMaxKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: effectiveImageModel,
              prompt: designPrompt,
              aspect_ratio: scene?.ratio || "1:1",
              resolution: `${sceneWidth}x${sceneHeight}`,
            }),
          }
        );

        if (!imgRes.ok) {
          console.error("MiniMax error:", await imgRes.text());
          continue;
        }

        const imgData = await imgRes.json();
        if (imgData.data?.image_urls?.[0]) {
          designs.push({
            id: `design_${i}_${Date.now()}`,
            imageUrl: imgData.data.image_urls[0],
          });
        }
      } catch (err) {
        console.error("Image gen error:", err);
      }
    }

    if (designs.length === 0) {
      designs.push({
        id: "placeholder_1",
        imageUrl: "",
        placeholder: true,
        label: `${sceneLabel} - ${selectedCopy.headline || "IdeaLab"}`,
      });
    }

    return NextResponse.json({
      copyOptions: copyOptions.map((c: any, i: number) => ({
        ...c,
        id: `copy_${i}_${Date.now()}`,
      })),
      designs,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "生成失败，请重试" }, { status: 500 });
  }
}
