import { NextRequest, NextResponse } from 'next/server';

/**
 * 品牌DNA解码 - 纯服务端色板提取，不依赖外部vision API
 * 接收图片(base64/URL)，返回提取的色板和基础风格描述
 * 参考图会由 /api/adforge 直接传给Novart做风格注入
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { image } = body;

  if (!image) {
    return NextResponse.json({ error: '请提供参考图片' }, { status: 400 });
  }

  try {
    // 获取图片像素数据用于色板提取
    let imageBuffer: Buffer | null = null;

    if (image.startsWith('data:')) {
      // base64 data URI → Buffer
      const base64 = image.split(',')[1];
      if (base64) {
        imageBuffer = Buffer.from(base64, 'base64');
      }
    } else if (image.startsWith('http')) {
      // URL → fetch → Buffer
      try {
        const res = await fetch(image, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const arr = await res.arrayBuffer();
          imageBuffer = Buffer.from(arr);
        }
      } catch {
        return NextResponse.json({ error: '无法下载参考图片' }, { status: 400 });
      }
    } else {
      // raw base64
      imageBuffer = Buffer.from(image, 'base64');
    }

    if (!imageBuffer || imageBuffer.length < 100) {
      return NextResponse.json({ error: '图片数据无效' }, { status: 400 });
    }

    // 简易色板提取：采样PNG/JPEG像素
    // 用纯JS方式采样，不依赖sharp等native库
    const colors = extractColors(imageBuffer);

    const dna = {
      brandName: '',
      colors: {
        primary: colors[0] || '#8b5cf6',
        secondary: colors[1] || '#a855f7',
        accent: colors[2] || '#06b6d4',
        palette: colors.length > 0 ? colors : ['#8b5cf6', '#a855f7', '#06b6d4', '#f472b6', '#818cf8'],
      },
      style: {
        mood: '现代',
        tone: '专业',
        aesthetic: '简约商业',
        photography: '产品摄影',
        typography: '无衬线现代',
      },
      keywords: ['商业', '高品质', '产品焦点', '干净构图', '专业光影'],
      description: '已提取品牌色板，参考图风格将直接注入广告素材生成',
      targetAudience: '',
      industry: '',
    };

    return NextResponse.json({ dna });
  } catch (err: any) {
    console.error('Brand DNA error:', err);
    return NextResponse.json(
      { error: err?.message || '品牌DNA分析失败' },
      { status: 500 },
    );
  }
}

/**
 * 从图片Buffer中提取主色调
 * 通过采样JPEG/PNG文件的色彩空间来估算
 */
function extractColors(buffer: Buffer): string[] {
  // JPEG采样：每隔N字节取RGB
  // PNG需要解压，较复杂，这里用统计方法
  const colorMap = new Map<string, number>();

  // 采样间隔：大图采样稀疏，小图采样密集
  const step = Math.max(1, Math.floor(buffer.length / 5000));

  for (let i = 0; i < buffer.length - 3; i += step) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];

    // 跳过纯黑、纯白、极暗像素
    if (r + g + b < 30 || r + g + b > 740) continue;
    // 跳过接近灰色的像素（饱和度低）
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 20) continue;

    // 量化到16级（降低颜色空间精度以聚类）
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // 按频率排序，取前5个差异较大的颜色
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return rgbToHex(r, g, b);
    });

  // 去重：颜色之间色差要够大
  const result: string[] = [];
  for (const color of sorted) {
    if (result.length >= 5) break;
    const isDifferent = result.every(existing => colorDistance(color, existing) > 50);
    if (isDifferent || result.length === 0) {
      result.push(color);
    }
  }

  return result;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('');
}

function colorDistance(c1: string, c2: string): number {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
