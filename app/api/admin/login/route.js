import crypto from "crypto";
import { NextResponse } from "next/server";
import { signToken, ADMIN_COOKIE } from "../../../../lib/auth";

function safeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD env var is not set. Add it in Vercel's Environment Variables.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const password = body.password || "";
  if (!password || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = signToken({ type: "admin" }, 60 * 60 * 8); // 8-hour admin session
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
