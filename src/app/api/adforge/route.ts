import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

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

async function generateFast(prompt: string, aspectRatio: string, fastMode: boolean = false): Promise<{ imageData: string } | null> {
  const size = fastMode ? '512x512' : (SIZE_MAP[aspectRatio] || '1024x1024');
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
          model: fastMode ? 'nova-image-pro-flex' : 'nova-image-pro-flex',
          prompt,
          n: 1,
          size,
          response_format: 'url',
        }),
        signal: AbortSignal.timeout(fastMode ? 30000 : 50000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[ADFORGE] ${res.status}:`, err.slice(0, 200));
        if (res.status === 401 || res.status === 402) return null;
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      const url = data?.data?.[0]?.url;

      if (url) {
        // Download the image and convert to base64
        try {
          const imgRes = await fetch(url, {
            headers: { 'Authorization': `Bearer ${NOVART_API_KEY}` },
            signal: AbortSignal.timeout(15000),
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get('content-type') || 'image/png';
            const b64 = buf.toString('base64');
            return { imageData: `data:${ct};base64,${b64}` };
          }
        } catch (e) {
          console.error('[ADFORGE] Download failed:', e);
        }
      }

      console.error('[ADFORGE] No url in response:', JSON.stringify(data).slice(0, 200));
    } catch (err: any) {
      console.error(`[ADFORGE] Attempt ${attempt + 1} error:`, err?.message);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

async function generateWithRef(prompt: string, aspectRatio: string, refImage: { mimeType: string; data: string }, fastMode: boolean = false): Promise<{ imageData: string } | null> {
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
        signal: AbortSignal.timeout(50000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[ADFORGE-REF] ${res.status}:`, err.slice(0, 200));
        if (res.status === 400 || res.status === 401 || res.status === 402) return null;
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      
      // Try inlineData first
      const parts = data?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          return { imageData: `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}` };
        }
      }
      
      // Fallback to download_url
      const downloadUrl = data?.novart?.results?.[0]?.download_url;
      if (downloadUrl) {
        try {
          const imgRes = await fetch(downloadUrl, {
            headers: { 'Authorization': `Bearer ${NOVART_API_KEY}` },
            signal: AbortSignal.timeout(15000),
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get('content-type') || 'image/png';
            const b64 = buf.toString('base64');
            return { imageData: `data:${ct};base64,${b64}` };
          }
        } catch (e) {
          console.error('[ADFORGE-REF] Download failed:', e);
        }
      }
      
      console.error('[ADFORGE-REF] No image data:', JSON.stringify(data).slice(0, 200));
    } catch (err: any) {
      console.error(`[ADFORGE-REF] Attempt ${attempt + 1} error:`, err?.message);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  return null;
}

/** POST: 同步生成单张图片 */
export async function POST(req: NextRequest) {
  if (!NOVART_API_KEY) {
    return NextResponse.json({ error: '未配置 API Key' }, { status: 400 });
  }

  const body = await req.json();
  const { brandName, sellingPoint, targetCountry, styleContext, referenceImage, sceneIndex, fastMode } = body;

  if (!brandName || !sellingPoint) {
    return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });
  }

  const sceneIdx = sceneIndex ?? 0;
  if (sceneIdx < 0 || sceneIdx >= SCENES.length) {
    return NextResponse.json({ error: '无效的场景索引' }, { status: 400 });
  }

  const scene = SCENES[sceneIdx];
  const aspectRatio = ASPECT_RATIOS[sceneIdx];
  const colorsHint = 'Professional, modern color palette.';

  const prompt = [
    `Professional e-commerce advertisement for brand "${brandName}".`,
    `Product: ${sellingPoint}.`,
    `Scene: ${scene.desc}.`,
    `Target audience: ${targetCountry || 'US'} consumers. Match local aesthetic preferences.`,
    `Style: ${colorsHint} Clean composition, natural lighting, shallow depth of field. Premium commercial photography quality.`,
    styleContext ? `\nBrand DNA Context: ${styleContext}` : '',
    referenceImage ? '\nCRITICAL: Match the reference image color scheme, mood, and aesthetic.' : '',
    `Requirements: Product is the hero. Aspirational but authentic. No text overlay. High resolution, sharp details.`,
  ].join('\n');

  let refData: { mimeType: string; data: string } | null = null;
  if (referenceImage) {
    refData = await resolveReferenceImage(referenceImage);
  }

  const generate = refData
    ? () => generateWithRef(prompt, aspectRatio, refData!, fastMode)
    : () => generateFast(prompt, aspectRatio, fastMode);

  const result = await generate();

  if (!result) {
    return NextResponse.json({ error: '图片生成失败' }, { status: 500 });
  }

  // 如果已登录：消耗 quota + 写 assets 表
  const session = await auth();
  if (session?.user?.id) {
    const userId = session.user.id;
    try {
      // 检查 quota
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { quotaTotal: true, quotaUsed: true } });
      if (user && user.quotaUsed < user.quotaTotal) {
        // 原子消耗 quota + 写 asset
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { quotaUsed: { increment: 1 } },
          }),
          prisma.asset.create({
            data: {
              userId,
              imageUrl: result.imageData,   // 存 base64，MVP 方案
              brandName,
              platform: getPlatformLabel(aspectRatio),
              sceneLabel: scene.label,
              aspectRatio,
              sourceUrl: body.sourceUrl || null,
            },
          }),
        ]);
      }
    } catch (e) {
      console.error('[ADFORGE] DB write failed:', e);
      // 不影响主流程，继续返回图片
    }
  }

  return NextResponse.json({
    image: {
      url: result.imageData,
      platform: getPlatformLabel(aspectRatio),
      scene: scene.label,
      ratio: aspectRatio,
    },
  });
}
