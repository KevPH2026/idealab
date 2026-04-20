import { Client } from "@notionhq/client";
import bcrypt from "bcryptjs";

const notion = new Client({
  auth: process.env.NOTION_API_KEY!,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionUser {
  id: string; // Notion page ID
  name: string;
  email: string;
  passwordHash: string;
  quotasRemaining: number;
  turnsUsed: number;
  createdAt: string;
}

// ─── Database helpers ─────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<NotionUser | null> {
  try {
    const response = await (notion.databases as any).query({
      database_id: DATABASE_ID,
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    if (response.results.length === 0) return null;

    const page = response.results[0];
    const props = page.properties;

    return {
      id: page.id,
      name: props.Name?.title?.[0]?.plain_text || "",
      email: props.Email?.email || "",
      passwordHash: props.SessionID?.rich_text?.[0]?.plain_text || "",
      quotasRemaining: props.QuotasRemaining?.number ?? 0,
      turnsUsed: props.TurnsUsed?.number ?? 0,
      createdAt: props.CreatedAt?.date?.start || page.created_time,
    };
  } catch {
    return null;
  }
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<NotionUser> {
  const existing = await findUserByEmail(params.email);
  if (existing) throw new Error("USER_EXISTS");

  const page = await (notion.pages as any).create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: params.name } }] },
      Email: { email: params.email },
      SessionID: { rich_text: [{ text: { content: params.passwordHash } }] },
      QuotasRemaining: { number: 5 },
      TurnsUsed: { number: 0 },
      CreatedAt: { date: { start: new Date().toISOString() } },
    },
  });

  return {
    id: page.id,
    name: params.name,
    email: params.email,
    passwordHash: params.passwordHash,
    quotasRemaining: 5,
    turnsUsed: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<NotionUser | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) return null;

  try {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  } catch {
    return null;
  }
}

export async function deductQuota(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  if (!user) return false;
  if (user.quotasRemaining <= 0) return false;

  try {
    await (notion.pages as any).update({
      page_id: user.id,
      properties: {
        QuotasRemaining: { number: user.quotasRemaining - 1 },
        TurnsUsed: { number: user.turnsUsed + 1 },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function addQuota(email: string, amount: number): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) return;

  try {
    await (notion.pages as any).update({
      page_id: user.id,
      properties: {
        QuotasRemaining: { number: user.quotasRemaining + amount },
      },
    });
  } catch {}
}

export async function getUserQuotas(email: string): Promise<{
  quotasRemaining: number;
  turnsUsed: number;
} | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return {
    quotasRemaining: user.quotasRemaining,
    turnsUsed: user.turnsUsed,
  };
}

export { notion };
