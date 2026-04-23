import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 180; // Vercel Pro可设300s，Hobby 60s

const NOVART_API_KEY = process.env.NOVART_API_KEY || '';
const NOVART_BASE_URL = process.env.NOVART_BASE_URL || 'https://www.novartspace.art';
const NOVART_MODEL = 'nova-g-image-2';

const SCENES = [
  { desc: 'lifestyle morning routine, natural light, clean aesthetic', label: '晨间生活' },
  { desc: 'outdoor golden hour, active lifestyle, aspirational feel', label: '户外黄金时段' },
  { desc: 'unboxing moment, excited expression, shallow depth of field', label: '开箱惊喜' },
  { desc: 'before and after transformation, split composition, dramatic', label: '使用对比' },
  { desc: 'casual UGC phone camera style, authentic, relatable', label: '素人UGC' },
  { desc: 'minimalist product on marble, studio lighting, luxury feel', label: '极简产品' },
  { desc: 'festive sale atmosphere, bold visual, promotional energy', label: '促销氛围' },
  { desc: 'happy customer using product outdoors, warm natural tones', label: '用户场景' },
];

const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '1:1', '2:3', '9:16', '16:9', '3:2'];

function getAspectRatioLabel(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': 'IG Feed (1:1)',
    '16:9': 'FB / Google (16:9)',
    '9:16': 'Story / TikTok (9:16)',
    '4:3': 'Pinterest (4:3)',
    '2:3': 'Pinterest (2:3)',
    '3:2': 'Landscape (3:2)',
  };
  return map[ratio] || ratio;
}

/**
 * 调用 Novart API 生成单张图片
 */
async function generateSingle(
  prompt: string,
  aspectRatio: string,
  referenceImage?: string,
): Promise<{ imageData: string; downloadUrl?: string } | null> {
  const endpoint = `${NOVART_BASE_URL}/v1beta/models/${NOVART_MODEL}:generateContent`;

  const parts: any[] = [{ text: prompt }];

  if (referenceImage) {
    let mimeType = 'image/png';
    let base64Data = referenceImage;
    if (referenceImage.startsWith('data:')) {
      const match = referenceImage.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    parts.push({ inlineData: { mimeType, data: base64Data } });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, novartResolution: '2k' },
    },
    novart: { includeResultUrls: true },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': NOVART_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Novart error (${res.status}):`, errText.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const parts_arr = data?.candidates?.[0]?.content?.parts || [];
    let imageData = '';
    for (const p of parts_arr) {
      if (p.inlineData?.data) {
        imageData = `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
        break;
      }
    }
    const downloadUrl = data?.novart?.results?.[0]?.download_url;

    if (!imageData && !downloadUrl) return null;
    return { imageData: imageData || '', downloadUrl: downloadUrl || undefined };
  } catch (err: any) {
    console.error('Novart fetch error:', err?.message || err);
    return null;
  }
}

/**
 * POST /api/adforge
 * 支持两种模式：
 * 1. 单张生成：{ sceneIndex, ...params } → 返回 { image }
 * 2. 批量生成：{ ...params } (无sceneIndex) → 返回 { images }
 */
export async function POST(req: NextRequest) {
  if (!NOVART_API_KEY) {
    return NextResponse.json({ error: '未配置 API Key' }, { status: 400 });
  }

  const body = await req.json();
  const { brandName, brandColors, sellingPoint, targetCountry, styleContext, referenceImage, sceneIndex } = body;

  if (!brandName || !sellingPoint) {
    return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });
  }

  const colorsHint = brandColors?.length
    ? `Brand color palette: ${brandColors.slice(0, 3).join(', ')}. Use these as accent colors.`
    : 'Professional, modern color palette.';

  const buildPrompt = (scene: typeof SCENES[0]) => [
    `Professional e-commerce advertisement for brand "${brandName}".`,
    `Product: ${sellingPoint}.`,
    `Scene: ${scene.desc}.`,
    `Target audience: ${targetCountry || 'US'} consumers. Match local aesthetic preferences.`,
    `Style: ${colorsHint} Clean composition, natural lighting, shallow depth of field. Premium commercial photography quality.`,
    styleContext ? `\nBrand DNA Context (CRITICAL): ${styleContext}` : '',
    referenceImage ? '\nCRITICAL: The attached reference image shows the brand visual style. Match its color scheme, mood, and aesthetic.' : '',
    `Requirements: Product is the hero. Aspirational but authentic. No text overlay. High resolution, sharp details.`,
  ].join('\n');

  // 单张模式：前端逐张请求，避免serverless超时
  if (typeof sceneIndex === 'number' && sceneIndex >= 0 && sceneIndex < SCENES.length) {
    const scene = SCENES[sceneIndex];
    const aspectRatio = ASPECT_RATIOS[sceneIndex];
    const prompt = buildPrompt(scene);

    const result = await generateSingle(prompt, aspectRatio, referenceImage);
    if (!result) {
      return NextResponse.json({ error: `场景"${scene.label}"生成失败` }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        url: result.downloadUrl || result.imageData,
        platform: getAspectRatioLabel(aspectRatio),
        scene: scene.label,
      },
    });
  }

  // 批量模式：后端一次生成8张（适用于非Vercel环境）
  const images: any[] = [];
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const prompt = buildPrompt(scene);
    const result = await generateSingle(prompt, ASPECT_RATIOS[i], referenceImage);
    if (result) {
      images.push({
        url: result.downloadUrl || result.imageData,
        platform: getAspectRatioLabel(ASPECT_RATIOS[i]),
        scene: scene.label,
      });
    }
  }

  if (images.length === 0) {
    return NextResponse.json({ error: '全部生成失败，请稍后重试' }, { status: 500 });
  }

  return NextResponse.json({ images });
}
