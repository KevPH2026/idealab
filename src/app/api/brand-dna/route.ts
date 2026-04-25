import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const maxDuration = 60;

interface DNAResult {
  brandName: string;
  industry: string;
  targetAudience: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    palette: string[];
    mood: string;
  };
  style: {
    mood: string;
    tone: string;
    aesthetic: string;
    photography: string;
    typography: string;
  };
  keywords: string[];
  sellingPoints: string[];
  description: string;
}

// ─── Color utilities ──────────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function colorDistance(c1: string, c2: string): number {
  const parse = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function getColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  if (max - min < 20) return l > 0.5 ? 'light gray' : 'dark gray';
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  if (h < 15 || h >= 345) return l > 0.5 ? 'light red' : 'deep red';
  if (h < 45) return l > 0.5 ? 'salmon' : 'rust';
  if (h < 65) return l > 0.5 ? 'khaki' : 'olive';
  if (h < 95) return l > 0.5 ? 'mint' : 'forest green';
  if (h < 150) return l > 0.5 ? 'sage green' : 'teal';
  if (h < 190) return l > 0.5 ? 'sky blue' : 'ocean blue';
  if (h < 260) return l > 0.5 ? 'periwinkle' : 'navy';
  if (h < 290) return l > 0.5 ? 'lavender' : 'purple';
  if (h < 345) return l > 0.5 ? 'pink' : 'magenta';
  return l > 0.5 ? 'light red' : 'deep red';
}

// ─── k-means color extraction ─────────────────────────────────────────────────

function kMeansColors(pixels: [number, number, number][], k: number): string[] {
  if (pixels.length < k) {
    return [...new Set(pixels.map(([r, g, b]) => rgbToHex(r, g, b)))].slice(0, k);
  }

  // Init centroids with k-means++ style
  let centroids: [number, number, number][] = [pixels[Math.floor(Math.random() * pixels.length)]];
  for (let i = 1; i < k; i++) {
    const dists = pixels.map(p =>
      Math.min(...centroids.map(c => (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2))
    );
    const total = dists.reduce((s, d) => s + d, 0);
    let rnd = Math.random() * total;
    for (let j = 0; j < pixels.length; j++) {
      rnd -= dists[j];
      if (rnd <= 0) { centroids.push(pixels[j]); break; }
    }
    if (centroids.length <= i) centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }

  // Run k-means for 15 iterations
  for (let iter = 0; iter < 15; iter++) {
    const clusters: [number, number, number][][] = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let minDist = Infinity, minIdx = 0;
      for (let ci = 0; ci < k; ci++) {
        const d = (p[0] - centroids[ci][0]) ** 2 + (p[1] - centroids[ci][1]) ** 2 + (p[2] - centroids[ci][2]) ** 2;
        if (d < minDist) { minDist = d; minIdx = ci; }
      }
      clusters[minIdx].push(p);
    }
    for (let ci = 0; ci < k; ci++) {
      if (clusters[ci].length > 0) {
        centroids[ci] = [
          Math.round(clusters[ci].reduce((s, p) => s + p[0], 0) / clusters[ci].length),
          Math.round(clusters[ci].reduce((s, p) => s + p[1], 0) / clusters[ci].length),
          Math.round(clusters[ci].reduce((s, p) => s + p[2], 0) / clusters[ci].length),
        ];
      }
    }
  }

  // Sort by cluster size (most common first) and deduplicate by distance
  const clusterSizes = centroids.map(() => 0);
  for (const p of pixels) {
    let minDist = Infinity, minIdx = 0;
    for (let ci = 0; ci < k; ci++) {
      const d = (p[0] - centroids[ci][0]) ** 2 + (p[1] - centroids[ci][1]) ** 2 + (p[2] - centroids[ci][2]) ** 2;
      if (d < minDist) { minDist = d; minIdx = ci; }
    }
    clusterSizes[minIdx]++;
  }

  const indexed = centroids.map((c, i) => ({ c, size: clusterSizes[i] }));
  indexed.sort((a, b) => b.size - a.size);

  const unique: string[] = [];
  for (const { c } of indexed) {
    const hex = rgbToHex(...c);
    if (!unique.some(e => colorDistance(hex, e) < 45)) unique.push(hex);
    if (unique.length >= k) break;
  }
  return unique;
}

async function extractColors(buffer: Buffer): Promise<string[]> {
  try {
    // Resize small for speed, get raw RGB pixels
    const { data, info } = await sharp(buffer)
      .resize(120, 120, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = r + g + b;
      if (brightness < 20 || brightness > 735) continue; // skip near-black / near-white
      const range = Math.max(r, g, b) - Math.min(r, g, b);
      if (range < 15) continue; // skip low-saturation
      pixels.push([r, g, b]);
    }

    if (pixels.length < 5) return ['#8b5cf6', '#a855f7', '#06b6d4', '#f472b6', '#818cf8'];
    return kMeansColors(pixels, 8);
  } catch {
    return ['#8b5cf6', '#a855f7', '#06b6d4', '#f472b6', '#818cf8'];
  }
}

// ─── Ollama LLM analysis ───────────────────────────────────────────────────────

async function analyzeWithOllama(colors: string[]): Promise<DNAResult | null> {
  const colorNames = colors.map(h => `${getColorName(h)} (${h})`).join(', ');

  const prompt = `You are a brand DNA analyst. Brand colors from a logo: ${colorNames}.
Output EXACTLY this JSON with no markdown, no text before or after:
{"industry":"one word: beauty|fashion|tech|food|fitness|home|automotive|finance|other","targetAudience":"one short sentence","mood":"one word","tone":"one word","aesthetic":"2-3 words max","keywords":["word1","word2","word3","word4","word5"],"sellingPoints":["short phrase","short phrase","short phrase"],"description":"one clear sentence"}`;

  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 55000);

    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: controller.signal,
    });

    clearTimeout(to);
    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    return {
      brandName: '',
      industry: parsed.industry || 'other',
      targetAudience: parsed.targetAudience || '',
      colors: {
        primary: colors[0] || '#8b5cf6',
        secondary: colors[1] || '#a855f7',
        accent: colors[2] || '#06b6d4',
        palette: colors.slice(0, 6),
        mood: parsed.mood || '',
      },
      style: {
        mood: parsed.mood || 'modern',
        tone: parsed.tone || 'professional',
        aesthetic: parsed.aesthetic || 'minimalist commercial',
        photography: 'product photography',
        typography: 'modern sans-serif',
      },
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
      sellingPoints: Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints.slice(0, 3) : [],
      description: parsed.description || '',
    };
  } catch (err) {
    console.error('[BRAND-DNA] Ollama failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Template fallback ────────────────────────────────────────────────────────

function buildTemplateDNA(colors: string[]): DNAResult {
  const colorNames = colors.map(getColorName);
  return {
    brandName: '',
    industry: 'other',
    targetAudience: '',
    colors: {
      primary: colors[0] || '#8b5cf6',
      secondary: colors[1] || '#a855f7',
      accent: colors[2] || '#06b6d4',
      palette: colors.slice(0, 6),
      mood: colorNames.slice(0, 3).join(', '),
    },
    style: {
      mood: 'modern',
      tone: 'professional',
      aesthetic: colorNames.slice(0, 2).join(' + ') || 'minimalist commercial',
      photography: 'product photography',
      typography: 'modern sans-serif',
    },
    keywords: ['commercial', 'high quality', 'product focus', 'clean composition', 'professional lighting'],
    sellingPoints: [],
    description: `Brand colors extracted: ${colorNames.slice(0, 3).join(', ')}. Style: modern minimalist commercial.`,
  };
}

// ─── Image resolution ─────────────────────────────────────────────────────────

async function resolveImage(image: string): Promise<Buffer | null> {
  try {
    if (image.startsWith('data:')) {
      const match = image.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (match) return Buffer.from(match[1], 'base64');
    } else if (image.startsWith('http')) {
      const res = await fetch(image, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } else {
      return Buffer.from(image, 'base64');
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { image } = body;

  if (!image) {
    return NextResponse.json({ error: '请提供参考图片' }, { status: 400 });
  }

  try {
    const buffer = await resolveImage(image);
    if (!buffer || buffer.length < 500) {
      return NextResponse.json({ error: '无法解析图片，请上传真实图片文件' }, { status: 400 });
    }

    // Extract dominant colors from actual pixel data
    const colors = await extractColors(buffer);

    // Analyze with Ollama LLM
    let dna = await analyzeWithOllama(colors);

    // Fallback to template
    if (!dna) {
      dna = buildTemplateDNA(colors);
    }

    return NextResponse.json({ dna });
  } catch (err: any) {
    console.error('[BRAND-DNA] Error:', err);
    return NextResponse.json({ error: err?.message || '品牌DNA分析失败' }, { status: 500 });
  }
}
