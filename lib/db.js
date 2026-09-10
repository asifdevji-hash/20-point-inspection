import { Pool } from "pg";

// Vercel's Postgres storage (Neon-backed) sets one of these depending on
// how it's provisioned/connected. `@vercel/postgres` is deprecated, so we
// talk to Postgres directly with `pg` instead and just read whichever
// connection string env var is present.
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool;

export function getPool() {
  if (!connectionString) {
    throw new Error(
      "No Postgres connection string found. Set POSTGRES_URL (or DATABASE_URL) " +
        "in your environment — e.g. by adding a Postgres database from the " +
        "Storage tab in Vercel and connecting it to this project."
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

let schemaReady = false;

// Creates the table on first use — no manual migration step required.
export async function ensureSchema() {
  if (schemaReady) return;
  const client = getPool();
  await client.query(`
    CREATE TABLE IF NOT EXISTS inspections (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      technician TEXT NOT NULL,
      site_name TEXT NOT NULL,
      general_notes TEXT,
      items JSONB NOT NULL
    );
  `);
  schemaReady = true;
}
