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

// Creates/updates tables on first use — no manual migration step required.
export async function ensureSchema() {
  if (schemaReady) return;
  const client = getPool();
  await client.query(`
    CREATE TABLE IF NOT EXISTS technicians (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      technician TEXT NOT NULL,
      site_name TEXT NOT NULL,
      general_notes TEXT,
      items JSONB NOT NULL
    );

    ALTER TABLE inspections
      ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);

    ALTER TABLE inspections
      ADD COLUMN IF NOT EXISTS site_address TEXT,
      ADD COLUMN IF NOT EXISTS client_contact_name TEXT,
      ADD COLUMN IF NOT EXISTS client_contact_email TEXT,
      ADD COLUMN IF NOT EXISTS client_contact_phone TEXT,
      ADD COLUMN IF NOT EXISTS service_pm_name TEXT,
      ADD COLUMN IF NOT EXISTS service_pm_email TEXT,
      ADD COLUMN IF NOT EXISTS service_pm_phone TEXT,
      ADD COLUMN IF NOT EXISTS tech_onsite_name TEXT,
      ADD COLUMN IF NOT EXISTS tech_onsite_email TEXT,
      ADD COLUMN IF NOT EXISTS tech_onsite_phone TEXT;
  `);
  schemaReady = true;
}

// Session cookies are stateless (signed, not stored server-side), so a
// deactivated technician's existing cookie would otherwise keep working
// until it expires. Re-checking `active` against the DB on each protected
// request makes admin deactivation take effect immediately.
export async function getActiveTechnician(id) {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT id, username, name, active FROM technicians WHERE id = $1",
    [id]
  );
  return rows[0] && rows[0].active ? rows[0] : null;
}
