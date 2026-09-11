import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, ensureSchema } from "../../../../lib/db";
import { readAdminSession, hashPassword } from "../../../../lib/auth";

function requireAdmin() {
  return readAdminSession(cookies());
}

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, username, name, active, created_at FROM technicians ORDER BY created_at DESC"
    );
    return NextResponse.json({ technicians: rows });
  } catch (err) {
    console.error("GET /api/admin/technicians failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const username = (body.username || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const password = body.password || "";

  if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-32 characters: lowercase letters, numbers, dots, dashes, underscores.",
      },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const pool = getPool();
    const passwordHash = hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO technicians (username, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, name, active, created_at`,
      [username, name, passwordHash]
    );
    return NextResponse.json({ technician: rows[0] }, { status: 201 });
  } catch (err) {
    if (err.code === "23505") {
      return NextResponse.json(
        { error: `Username "${username}" is already taken` },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/technicians failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
