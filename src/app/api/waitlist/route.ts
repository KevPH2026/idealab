import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

// 本地存储路径 (fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readWaitlist(): any[] {
  ensureDataDir();
  if (!fs.existsSync(WAITLIST_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveWaitlist(entries: any[]) {
  ensureDataDir();
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, brand, contact } = body;

    if (!name?.trim() || !brand?.trim() || !contact?.trim()) {
      return NextResponse.json({ error: '姓名、品牌链接和联系方式均为必填项' }, { status: 400 });
    }

    const entry = {
      id: `wl_${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString(),
    };

    // 尝试 Notion
    if (NOTION_API_KEY.length > 20 && NOTION_DATABASE_ID) {
      try {
        const res = await fetch(`https://api.notion.com/v1/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
              'Name': {
                title: [{ text: { content: entry.name } }],
              },
              'Brand': {
                rich_text: [{ text: { content: entry.brand } }],
              },
              'Contact': {
                rich_text: [{ text: { content: entry.contact } }],
              },
            },
          }),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, source: 'notion' });
        }
        const err = await res.json().catch(() => ({}));
        console.error('[WAITLIST] Notion error:', JSON.stringify(err));
        // Notion 失败，fallback 到本地
      } catch (e) {
        console.error('[WAITLIST] Notion exception:', e);
      }
    }

    // Fallback: 本地 JSON 存储
    const list = readWaitlist();
    list.push(entry);
    saveWaitlist(list);

    return NextResponse.json({ success: true, source: 'local', id: entry.id });
  } catch (err: any) {
    console.error('[WAITLIST] Error:', err);
    return NextResponse.json({ error: err?.message || '保存失败' }, { status: 500 });
  }
}

// GET: 读取 waitlist (admin only)
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key');
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = readWaitlist();
  return NextResponse.json({ count: list.length, entries: list });
}
