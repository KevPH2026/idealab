import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export const maxDuration = 60;

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

const SCENES = [
  { desc: 'lifestyle morning routine, natural light, clean aesthetic', label: '晨间生活' },
  { desc: 'outdoor golden hour, active lifestyle, aspirational feel', label: '户外黄金时段' },
  { desc: 'unboxing moment, excited expression, shallow depth of field', label: '开箱惊喜' },
  { desc: 'before and after transformation, split composition, dramatic', label: '使用对比' },
  { desc: 'flat lay product photography, clean white background, lifestyle accessories', label: '产品平铺' },
  { desc: 'minimalist product on marble, studio lighting, luxury feel', label: '极简产品' },
  { desc: 'festive sale atmosphere, bold visual, promotional energy', label: '促销氛围' },
  { desc: 'scenic outdoor landscape with product as focal point, warm golden tones', label: '户外场景' },
];

const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '1:1', '2:3', '9:16', '16:9', '3:2'];

// MiniMax image-01 supports: 1:1, 16:9, 4:3, 3:2, 2:3, 3:4, 9:16
const MINIMAX_RATIO_MAP: Record<string, string> = {
  '1:1':  '1:1',
  '16:9': '16:9',
  '9:16': '9:16',
  '4:3':  '4:3',
  '2:3':  '2:3',
  '3:2':  '3:2',
};

function getPlatformLabel(ratio: string): string {
  const map: Record<string, string> = {
    '1:1':  'IG Feed (1:1)',
    '16:9': 'FB / Google (16:9)',
    '9:16': 'Story / TikTok (9:16)',
    '4:3':  'Pinterest (4:3)',
    '2:3':  'Pinterest (2:3)',
    '3:2':  'Landscape (3:2)',
  };
  return map[ratio] || ratio;
}

/** 用 MiniMax image-01 生成图片，返回可访问的 image URL */
async function generateWithMinimax(prompt: string, aspectRatio: string): Promise<{ imageUrl: string } | null> {
  const ratio = MINIMAX_RATIO_MAP[aspectRatio] || '1:1';

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.minimax.chat/v1/image_generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'image-01',
          prompt,
          aspect_ratio: ratio,
          response_format: 'url',
          n: 1,
        }),
        signal: AbortSignal.timeout(55000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[ADFORGE] MiniMax ${res.status}:`, err.slice(0, 200));
        if (res.status === 401 || res.status === 402 || res.status === 400) return null;
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const data = await res.json();

      // MiniMax 返回格式: { id, data: { image_urls: [...] } }
      const urls: string[] = data?.data?.image_urls || [];
      if (urls.length > 0 && urls[0]) {
        return { imageUrl: urls[0] };
      }

      console.error('[ADFORGE] MiniMax no image_urls:', JSON.stringify(data).slice(0, 200));
    } catch (err: any) {
      console.error(`[ADFORGE] Attempt ${attempt + 1} error:`, err?.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null;
}

/** 把外部 URL 的图片下载后上传到 Vercel Blob，返回持久 URL */
async function uploadToBlobFromUrl(sourceUrl: string, filename: string): Promise<string> {
  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || 'image/jpeg';
  const blob = await put(filename, buf, { access: 'public', contentType: ct });
  return blob.url;
}

/** POST: 同步生成单张图片 */
export async function POST(req: NextRequest) {
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: '未配置生图 API Key' }, { status: 400 });
  }

  const body = await req.json();
  const { brandName, sellingPoint, targetCountry, styleContext, sceneIndex } = body;

  if (!brandName || !sellingPoint) {
    return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });
  }

  const sceneIdx = sceneIndex ?? 0;
  if (sceneIdx < 0 || sceneIdx >= SCENES.length) {
    return NextResponse.json({ error: '无效的场景索引' }, { status: 400 });
  }

  const scene = SCENES[sceneIdx];
  const aspectRatio = ASPECT_RATIOS[sceneIdx];

  const prompt = [
    `Professional e-commerce advertisement for brand "${brandName}".`,
    `Product: ${sellingPoint}.`,
    `Scene: ${scene.desc}.`,
    `Target audience: ${targetCountry || 'US'} consumers. Match local aesthetic preferences.`,
    `Style: Professional, modern color palette. Clean composition, natural lighting. Premium commercial photography quality.`,
    styleContext ? `\nBrand DNA Context: ${styleContext}` : '',
    `Requirements: Product is the hero. Aspirational but authentic. No text overlay. High resolution, sharp details.`,
  ].filter(Boolean).join('\n');

  // 生成图片
  const result = await generateWithMinimax(prompt, aspectRatio);
  if (!result) {
    return NextResponse.json({ error: '图片生成失败，请重试' }, { status: 500 });
  }

  // 上传到 Vercel Blob（MiniMax URL 是临时的，转为持久 URL）
  let persistentUrl = result.imageUrl;
  try {
    const ext = 'jpg';
    const safeBrand = brandName.replace(/\s+/g, '-').toLowerCase().slice(0, 30);
    const filename = `assets/${safeBrand}-scene${sceneIdx}-${Date.now()}.${ext}`;
    persistentUrl = await uploadToBlobFromUrl(result.imageUrl, filename);
  } catch (e) {
    console.error('[ADFORGE] Blob upload failed, using source URL:', e);
    // fallback: 使用 MiniMax 原始 URL（短期有效）
  }

  // 如果已登录：消耗 quota + 写 assets 表
  try {
    const session = await auth();
    if (session?.user?.id) {
      const userId = session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { quotaTotal: true, quotaUsed: true },
      });
      if (user && user.quotaUsed < user.quotaTotal) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { quotaUsed: { increment: 1 } },
          }),
          prisma.asset.create({
            data: {
              userId,
              imageUrl: persistentUrl,
              brandName,
              platform: getPlatformLabel(aspectRatio),
              sceneLabel: scene.label,
              aspectRatio,
              sourceUrl: body.sourceUrl || null,
            },
          }),
        ]);
      }
    }
  } catch (e) {
    console.error('[ADFORGE] DB write failed:', e);
    // 不阻断主流程
  }

  return NextResponse.json({
    image: {
      url: persistentUrl,
      platform: getPlatformLabel(aspectRatio),
      scene: scene.label,
      ratio: aspectRatio,
    },
  });
}
