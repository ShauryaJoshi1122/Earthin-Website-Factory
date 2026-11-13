import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set. Please set DATABASE_URL or link your Neon database.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database...');
    // Create migrations tracker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);

    const drizzleDir = join(process.cwd(), 'drizzle');
    const files = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'));

    for (const file of files) {
      console.log(`Running migration: ${file}...`);
      const sql = readFileSync(join(drizzleDir, file), 'utf8');
      await client.query(sql);
      console.log(`Migration ${file} applied successfully.`);
    }

    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
