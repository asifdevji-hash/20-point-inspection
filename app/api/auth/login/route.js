import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../../lib/db";
import { verifyPassword, signToken, SESSION_COOKIE } from "../../../../lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, username, name, password_hash, active FROM technicians WHERE username = $1",
      [username]
    );
    const tech = rows[0];
    if (!tech || !tech.active || !verifyPassword(password, tech.password_hash)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      type: "technician",
      id: tech.id,
      username: tech.username,
      name: tech.name,
    });

    const res = NextResponse.json({ name: tech.name });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return NextResponse.json(
      { error: err.message || "Login failed" },
      { status: 500 }
    );
  }
}
