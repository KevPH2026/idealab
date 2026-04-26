import { NextRequest, NextResponse } from 'next/server';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

export async function POST(req: NextRequest) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json({ error: 'Notion 未配置' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { name, brand, contact } = body;

    if (!name?.trim() || !contact?.trim()) {
      return NextResponse.json({ error: '名字和联系方式必填' }, { status: 400 });
    }

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
            title: [{ text: { content: name.trim() } }],
          },
          'Brand': {
            rich_text: [{ text: { content: brand?.trim() || '' } }],
          },
          'Contact': {
            rich_text: [{ text: { content: contact.trim() } }],
          },
          'Source': {
            select: { name: '100x Waitlist' },
          },
          'Status': {
            select: { name: 'Pending' },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[WAITLIST] Notion error:', err);
      return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[WAITLIST] Error:', err);
    return NextResponse.json({ error: err?.message || '保存失败' }, { status: 500 });
  }
}
