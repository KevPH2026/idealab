import { NextRequest, NextResponse } from 'next/server';

// Novart API 配置（仅后端，key存在环境变量中）
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

// 8张素材的宽高比分配 (nova-g-image-2: auto, 16:9, 9:16, 1:1, 3:2, 2:3)
const ASPECT_RATIOS = ['1:1', '9:16', '16:9', '1:1', '2:3', '9:16', '16:9', '3:2'];

interface ImageResult {
  url: string;
  platform: string;
  scene: string;
}

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
 * 调用 Novart API (Google-style generateContent)
 */
async function generateWithNovart(
  prompt: string,
  aspectRatio: string,
  referenceImage?: string,
): Promise<{ imageData: string; downloadUrl?: string } | null> {
  const endpoint = `${NOVART_BASE_URL}/v1beta/models/${NOVART_MODEL}:generateContent`;

  const parts: any[] = [{ text: prompt }];

  // 如果有参考图（base64 data URI），添加到parts
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
    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
        novartResolution: '2k',
      },
    },
    novart: {
      includeResultUrls: true,
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': NOVART_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Novart API error (${res.status}):`, errText.slice(0, 500));
      return null;
    }

    const data = await res.json();

    // 提取图片：candidates[0].content.parts[].inlineData
    const parts_arr = data?.candidates?.[0]?.content?.parts || [];
    let imageData = '';
    for (const p of parts_arr) {
      if (p.inlineData?.data) {
        imageData = `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
        break;
      }
    }

    // 提取下载URL
    const downloadUrl = data?.novart?.results?.[0]?.download_url;

    if (!imageData && !downloadUrl) {
      console.error('No image in Novart response:', JSON.stringify(data).slice(0, 300));
      return null;
    }

    return {
      imageData: imageData || '',
      downloadUrl: downloadUrl || undefined,
    };
  } catch (err: any) {
    console.error('Novart fetch error:', err?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!NOVART_API_KEY) {
    return NextResponse.json(
      { error: '未配置 Novart API Key，请联系管理员' },
      { status: 400 },
    );
  }

  const body = await req.json();
  const { brandName, brandColors, sellingPoint, targetCountry, styleContext, referenceImage } = body;

  if (!brandName || !sellingPoint) {
    return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });
  }

  const images: ImageResult[] = [];

  const tasks = SCENES.map((scene, i) => {
    const aspectRatio = ASPECT_RATIOS[i];
    const colorsHint = brandColors?.length
      ? `Brand color palette: ${brandColors.slice(0, 3).join(', ')}. Use these as accent colors.`
      : 'Professional, modern color palette.';

    const prompt = [
      `Professional e-commerce advertisement for brand "${brandName}".`,
      `Product: ${sellingPoint}.`,
      `Scene: ${scene.desc}.`,
      `Target audience: ${targetCountry || 'US'} consumers. Match local aesthetic preferences.`,
      `Style: ${colorsHint} Clean composition, natural lighting, shallow depth of field. Premium commercial photography quality.`,
      styleContext ? `\nBrand DNA Context (CRITICAL - follow this style strictly): ${styleContext}` : '',
      `Requirements: Product is the hero. Aspirational but authentic. No text overlay. High resolution, sharp details.`,
    ].join('\n');

    return generateWithNovart(prompt, aspectRatio, referenceImage)
      .then((result) => {
        if (result) {
          const url = result.downloadUrl || result.imageData;
          images.push({
            url,
            platform: getAspectRatioLabel(aspectRatio),
            scene: scene.label,
          });
        }
      })
      .catch((err) => {
        console.error(`Scene "${scene.label}" failed:`, err?.message || err);
      });
  });

  await Promise.all(tasks);

  if (images.length === 0) {
    return NextResponse.json(
      { error: '全部生成失败，请稍后重试' },
      { status: 500 },
    );
  }

  return NextResponse.json({ images });
}
