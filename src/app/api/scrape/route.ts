import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const maxDuration = 30;

interface ScrapeResult {
  title: string;
  description: string;
  images: string[];           // 最多5张主图 URL
  brand: string;
  keywords: string[];
  price?: string;
  sourceUrl: string;
}

function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function isValidImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(u.pathname) || u.hostname !== '';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!url?.trim()) {
    return NextResponse.json({ error: '请提供网址' }, { status: 400 });
  }

  // 规范化 URL
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    const res = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `页面无法访问 (HTTP ${res.status})` },
        { status: 422 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // ── 提取标题 ──────────────────────────────────────────
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    // ── 提取描述 ──────────────────────────────────────────
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('p').first().text().slice(0, 200) ||
      '';

    // ── 提取品牌名 ────────────────────────────────────────
    const brand =
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      new URL(normalizedUrl).hostname.replace(/^www\./, '').split('.')[0] ||
      '';

    // ── 提取关键词 ────────────────────────────────────────
    const kwRaw = $('meta[name="keywords"]').attr('content') || '';
    const keywords = kwRaw
      ? kwRaw.split(/[,，;；]/).map(k => k.trim()).filter(Boolean).slice(0, 8)
      : [];

    // ── 提取价格 ──────────────────────────────────────────
    const price =
      $('[itemprop="price"]').attr('content') ||
      $('[class*="price"]').first().text().trim().slice(0, 30) ||
      undefined;

    // ── 提取图片 ──────────────────────────────────────────
    const imageSet = new Set<string>();

    // 1. OG / Twitter 主图（最高优先级）
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) imageSet.add(resolveUrl(normalizedUrl, ogImage));
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage) imageSet.add(resolveUrl(normalizedUrl, twitterImage));

    // 2. 产品主图 — 常见选择器
    const productSelectors = [
      '[class*="product"] img',
      '[class*="hero"] img',
      '[id*="product"] img',
      'main img',
      'article img',
      '.gallery img',
      '[class*="gallery"] img',
      '[class*="carousel"] img',
      '[class*="slider"] img',
    ];
    for (const sel of productSelectors) {
      if (imageSet.size >= 8) break;
      $(sel).each((_, el) => {
        if (imageSet.size >= 8) return false;
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
        if (src && !src.startsWith('data:')) {
          const abs = resolveUrl(normalizedUrl, src);
          if (isValidImageUrl(abs)) imageSet.add(abs);
        }
      });
    }

    // 3. 页面内所有 img（兜底）
    if (imageSet.size < 3) {
      $('img').each((_, el) => {
        if (imageSet.size >= 8) return false;
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
        const w = parseInt($(el).attr('width') || '0');
        const h = parseInt($(el).attr('height') || '0');
        // 过滤掉小图（可能是 icon/logo）
        if (src && !src.startsWith('data:') && (w === 0 || w >= 200) && (h === 0 || h >= 200)) {
          const abs = resolveUrl(normalizedUrl, src);
          if (isValidImageUrl(abs)) imageSet.add(abs);
        }
      });
    }

    const images = Array.from(imageSet).slice(0, 5);

    const result: ScrapeResult = {
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 500),
      images,
      brand: brand.trim().slice(0, 50),
      keywords,
      price,
      sourceUrl: normalizedUrl,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[SCRAPE]', err?.message);
    return NextResponse.json(
      { error: '解析失败，请检查网址是否可访问' },
      { status: 422 }
    );
  }
}
