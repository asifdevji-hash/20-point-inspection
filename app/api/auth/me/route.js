import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession } from "../../../../lib/auth";

export async function GET() {
  const session = readSession(cookies());
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  return NextResponse.json({
    session: { name: session.name, username: session.username },
  });
}
