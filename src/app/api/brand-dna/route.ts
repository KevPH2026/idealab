import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config', 'models.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); } catch { return null; }
}

function getVisionConfig() {
  const config = readConfig();
  const or = config?.openrouter || {};
  return {
    apiKey: or.apiKey || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: or.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
  };
}

export async function POST(req: NextRequest) {
  const { apiKey, model } = getVisionConfig();
  if (!apiKey) {
    return NextResponse.json({ error: '未配置 Vision API Key，请在后台配置 OpenRouter Key' }, { status: 400 });
  }

  const body = await req.json();
  const { image } = body; // base64 data URI or URL

  if (!image) {
    return NextResponse.json({ error: '请提供参考图片' }, { status: 400 });
  }

  // Build image content block
  let imageBlock: any;
  if (image.startsWith('data:')) {
    imageBlock = { type: 'image_url', image_url: { url: image } };
  } else if (image.startsWith('http')) {
    imageBlock = { type: 'image_url', image_url: { url: image } };
  } else {
    // Raw base64
    imageBlock = { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } };
  }

  const prompt = `你是一个品牌DNA分析师。请分析这张品牌参考图片，提取以下品牌DNA信息，用JSON格式返回：

{
  "brandName": "从图片中识别的品牌名（如果有）",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
  },
  "style": {
    "mood": "整体氛围词，如：奢华/简约/活力/科技感/温馨/街头",
    "tone": "调性，如：高端/亲民/专业/年轻/成熟",
    "aesthetic": "美学风格，如：极简主义/杂志风/赛博朋克/北欧/日式",
    "photography": "摄影风格，如：产品特写/生活场景/棚拍/户外自然光",
    "typography": "字体感觉，如：衬线优雅/无衬线现代/手写亲切/粗体力量"
  },
  "keywords": ["5个最能描述这个品牌视觉风格的关键词"],
  "description": "一句话总结这个品牌的视觉风格DNA",
  "targetAudience": "推测的目标受众",
  "industry": "推测的行业/品类"
}

只返回JSON，不要其他文字。如果图片中有产品，描述产品类型和视觉特征。`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://100x.pics',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            imageBlock,
          ],
        }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Vision API error:', res.status, errText.slice(0, 500));
      return NextResponse.json({ error: `视觉分析失败 (${res.status})` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '无法解析品牌DNA', raw: content.slice(0, 500) }, { status: 500 });
    }

    const dna = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ dna });
  } catch (err: any) {
    console.error('Brand DNA error:', err);
    return NextResponse.json({ error: err?.message || '分析失败' }, { status: 500 });
  }
}
