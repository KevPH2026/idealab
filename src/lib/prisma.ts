/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const { createClient } = require('@libsql/client');
  const { PrismaLibSql } = require('@prisma/adapter-libsql');

  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const url = dbUrl.startsWith('file:')
    ? 'file:' + path.resolve(process.cwd(), dbUrl.replace('file:', ''))
    : dbUrl;

  const libsql = createClient({ url });
  const adapter = new PrismaLibSql(libsql);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
