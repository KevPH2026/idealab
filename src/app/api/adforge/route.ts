import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 180;

const NOVART_API_KEY = process.env.NOVART_API_KEY || '';
const NOVART_BASE_URL = process.env.NOVART_BASE_URL || 'https://www.novartspace.art';

const SCENES = [
  { desc: 'lifestyle morning routine, natural light, clean aesthetic', label: '晨间生活' },
  { desc: 'outdoor golden hour, active lifestyle, aspirational feel', label: '户外黄金时段' },
  { desc: 'unboxing moment, excited expression, shallow depth of field', label: '开箱惊喜' },
  { desc: 'before and after transformation, split composition, dramatic', label: '使用对比' },
  { desc: 'flat lay product photography, clean white background, lifestyle accessories around product', label: '产品平铺' },
  { desc: 'minimalist product on marble, studio lighting, luxury feel', label: '极简产品' },
  { desc: 'festive sale atmosphere, bold visual, promotional energy', label: '促销氛围' },
  { desc: 'scenic outdoor landscape with product as focal point, warm golden tones, wide composition', label: '户外场景' },
];

const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '1:1', '2:3', '9:16', '16:9', '3:2'];

const SIZE_MAP: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1344x768',
  '9:16': '768x1344',
  '4:3': '1024x768',
  '2:3': '768x1152',
  '3:2': '1152x768',
};

function getPlatformLabel(ratio: string): string {
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

/** 解析参考图为 base64 */
async function resolveReferenceImage(ref: string): Promise<{ mimeType: string; data: string } | null> {
  if (ref.startsWith('data:')) {
    const match = ref.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], data: match[2] };
    return null;
  }
  if (ref.startsWith('http')) {
    try {
      const res = await fetch(ref, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || 'image/png';
      return { mimeType: ct, data: buf.toString('base64') };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 无参考图：OpenAI兼容端点 (nova-image-pro-flex, 只支持url格式)
 */
async function generateFast(
  prompt: string,
  aspectRatio: string,
): Promise<{ imageData: string; downloadUrl?: string } | null> {
  const size = SIZE_MAP[aspectRatio] || '1024x1024';
  const endpoint = `${NOVART_BASE_URL}/v1/images/generations`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOVART_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nova-image-pro-flex',
          prompt,
          n: 1,
          size,
          response_format: 'url',
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[ADFORGE-FAST] ${res.status}:`, err.slice(0, 200));
        if (res.status === 401 || res.status === 402) return null;
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      const url = data?.data?.[0]?.url;

      if (url) {
        // Download the image and convert to base64 so frontend can display it directly
        try {
          const imgRes = await fetch(url, {
            headers: { 'Authorization': `Bearer ${NOVART_API_KEY}` },
            signal: AbortSignal.timeout(30000),
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get('content-type') || 'image/png';
            const b64 = buf.toString('base64');
            return { imageData: `data:${ct};base64,${b64}`, downloadUrl: url };
          }
        } catch (e) {
          console.error('[ADFORGE-FAST] Download failed:', e);
        }
        return { imageData: '', downloadUrl: url };
      }

      console.error('[ADFORGE-FAST] No image in response:', JSON.stringify(data).slice(0, 200));
    } catch (err: any) {
      console.error(`[ADFORGE-FAST] Attempt ${attempt + 1} error:`, err?.message);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

/**
 * 有参考图：原生Gemini端点 (nova-image-pro, 支持inlineData + URL回传)
 */
async function generateWithRef(
  prompt: string,
  aspectRatio: string,
  refImage: { mimeType: string; data: string },
): Promise<{ imageData: string; downloadUrl?: string } | null> {
  const endpoint = `${NOVART_BASE_URL}/v1beta/models/nova-image-pro:generateContent`;
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: refImage.mimeType, data: refImage.data } },
      ],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, novartResolution: '1k' },
    },
    novart: { includeResultUrls: true },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
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
        const err = await res.text();
        console.error(`[ADFORGE-REF] ${res.status}:`, err.slice(0, 200));
        if (res.status === 400 || res.status === 401 || res.status === 402) return null;
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let imageData = '';
      for (const p of parts) {
        if (p.inlineData?.data) {
          imageData = `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
          break;
        }
      }
      const downloadUrl = data?.novart?.results?.[0]?.download_url;
      if (imageData || downloadUrl) {
        return { imageData, downloadUrl };
      }
      console.error('[ADFORGE-REF] No image data:', JSON.stringify(data).slice(0, 200));
    } catch (err: any) {
      console.error(`[ADFORGE-REF] Attempt ${attempt + 1} error:`, err?.message);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

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

  // 解析参考图（如果有）
  let refData: { mimeType: string; data: string } | null = null;
  if (referenceImage) {
    refData = await resolveReferenceImage(referenceImage);
    if (!refData) {
      console.error('[ADFORGE] Failed to resolve reference image');
    }
  }

  const generate = refData
    ? (prompt: string, ratio: string) => generateWithRef(prompt, ratio, refData!)
    : (prompt: string, ratio: string) => generateFast(prompt, ratio);

  // 单张模式
  if (typeof sceneIndex === 'number' && sceneIndex >= 0 && sceneIndex < SCENES.length) {
    const scene = SCENES[sceneIndex];
    const aspectRatio = ASPECT_RATIOS[sceneIndex];
    const prompt = buildPrompt(scene);

    const result = await generate(prompt, aspectRatio);
    if (!result) {
      return NextResponse.json({ error: `场景"${scene.label}"生成失败` }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        url: result.downloadUrl || result.imageData,
        platform: getPlatformLabel(aspectRatio),
        scene: scene.label,
      },
    });
  }

  // 批量模式
  const images: any[] = [];
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const prompt = buildPrompt(scene);
    const result = await generate(prompt, ASPECT_RATIOS[i]);
    if (result) {
      images.push({
        url: result.downloadUrl || result.imageData,
        platform: getPlatformLabel(ASPECT_RATIOS[i]),
        scene: scene.label,
      });
    }
  }

  if (images.length === 0) {
    return NextResponse.json({ error: '全部生成失败，请稍后重试' }, { status: 500 });
  }

  return NextResponse.json({ images });
}
