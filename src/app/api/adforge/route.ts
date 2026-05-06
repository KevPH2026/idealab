import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

const NOVART_API_KEY = process.env.NOVART_API_KEY || '';
const NOVART_BASE_URL = process.env.NOVART_BASE_URL || 'https://www.novartspace.art';

// In-memory task store (use KV/Redis in production)
const taskStore = new Map<string, {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  images: Array<{ url: string; platform: string; scene: string; ratio: string }>;
  error?: string;
  total: number;
  completed: number;
}>();

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

async function generateFast(prompt: string, aspectRatio: string): Promise<{ imageData: string; downloadUrl?: string } | null> {
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

async function generateWithRef(prompt: string, aspectRatio: string, refImage: { mimeType: string; data: string }): Promise<{ imageData: string; downloadUrl?: string } | null> {
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

/** 后台异步生成 */
async function runGeneration(taskId: string, brandName: string, sellingPoint: string, targetCountry: string, styleContext: string, referenceImage: string | null, selectedScenes: number[]) {
  const colorsHint = 'Professional, modern color palette.';

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

  let refData: { mimeType: string; data: string } | null = null;
  if (referenceImage) {
    refData = await resolveReferenceImage(referenceImage);
  }

  const generate = refData
    ? (prompt: string, ratio: string) => generateWithRef(prompt, ratio, refData!)
    : (prompt: string, ratio: string) => generateFast(prompt, ratio);

  const task = taskStore.get(taskId)!;
  task.status = 'generating';

  for (let i = 0; i < selectedScenes.length; i++) {
    const sceneIdx = selectedScenes[i];
    const scene = SCENES[sceneIdx];
    const aspectRatio = ASPECT_RATIOS[sceneIdx];
    const prompt = buildPrompt(scene);

    try {
      const result = await generate(prompt, aspectRatio);
      if (result) {
        let imageUrl = result.imageData;
        if (!imageUrl && result.downloadUrl) {
          try {
            const imgRes = await fetch(result.downloadUrl, {
              headers: { 'Authorization': `Bearer ${NOVART_API_KEY}` },
              signal: AbortSignal.timeout(30000),
            });
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              const ct = imgRes.headers.get('content-type') || 'image/png';
              imageUrl = `data:${ct};base64,${buf.toString('base64')}`;
            } else {
              imageUrl = result.downloadUrl;
            }
          } catch (e) {
            imageUrl = result.downloadUrl;
          }
        }

        task.images.push({
          url: imageUrl,
          platform: getPlatformLabel(aspectRatio),
          scene: scene.label,
          ratio: aspectRatio,
        });
        task.completed++;
      }
    } catch (err) {
      console.error(`[TASK ${taskId}] Scene ${sceneIdx} failed:`, err);
    }
  }

  task.status = task.images.length > 0 ? 'completed' : 'failed';
  if (task.images.length === 0) {
    task.error = '全部生成失败，请稍后重试';
  }
}

/** POST: 创建任务 */
export async function POST(req: NextRequest) {
  if (!NOVART_API_KEY) {
    return NextResponse.json({ error: '未配置 API Key' }, { status: 400 });
  }

  const body = await req.json();
  const { brandName, sellingPoint, targetCountry, styleContext, referenceImage, selectedScenes } = body;

  if (!brandName || !sellingPoint) {
    return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });
  }

  const scenes = selectedScenes || [0, 1, 2, 3];
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  taskStore.set(taskId, {
    status: 'pending',
    images: [],
    total: scenes.length,
    completed: 0,
  });

  // Fire-and-forget: start generation in background
  runGeneration(taskId, brandName, sellingPoint, targetCountry || 'US', styleContext || '', referenceImage || null, scenes);

  return NextResponse.json({ taskId, status: 'pending', total: scenes.length });
}

/** GET: 查询任务状态 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: '缺少taskId' }, { status: 400 });
  }

  const task = taskStore.get(taskId);
  if (!task) {
    return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  }

  return NextResponse.json({
    taskId,
    status: task.status,
    total: task.total,
    completed: task.completed,
    images: task.status === 'completed' ? task.images : undefined,
    error: task.error,
  });
}
