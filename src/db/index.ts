import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import * as schema from './schema';
import { CONFIG } from '@/lib/config';

const connectionString = CONFIG.DATABASE_URL;

function createDb() {
  if (!connectionString) {
    return {
      query: {} as any,
      select: () => {
        throw new Error('DATABASE_URL is not configured. Please connect Neon PostgreSQL via Vercel Marketplace.');
      },
      insert: () => {
        throw new Error('DATABASE_URL is not configured. Please connect Neon PostgreSQL via Vercel Marketplace.');
      },
      update: () => {
        throw new Error('DATABASE_URL is not configured. Please connect Neon PostgreSQL via Vercel Marketplace.');
      },
      delete: () => {
        throw new Error('DATABASE_URL is not configured. Please connect Neon PostgreSQL via Vercel Marketplace.');
      },
      transaction: () => {
        throw new Error('DATABASE_URL is not configured. Please connect Neon PostgreSQL via Vercel Marketplace.');
      },
    } as any;
  }

  // Detect if connecting to Neon Serverless host (e.g. *.neon.tech)
  const isNeonHost = connectionString.includes('neon.tech');

  if (isNeonHost) {
    const pool = new Pool({ connectionString });
    return drizzleNeon(pool, { schema });
  } else {
    const pool = new PgPool({ connectionString });
    return drizzlePg(pool, { schema });
  }
}

export const db = createDb();
export * from './schema';
